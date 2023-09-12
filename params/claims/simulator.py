#!/usr/bin/env python
###############################################################################

import argparse
import numpy as np
import matplotlib.cm as cm
import matplotlib.pyplot as pp
from scipy.integrate import solve_ivp

###############################################################################
###############################################################################

np.set_printoptions(suppress=True, formatter={"float": "{:0.6e}".format})

###############################################################################
###############################################################################


class Simulator:
    """
    Simulates the wealth distribution among groups (split by threshold values),
    based on a system of ordinary differential equations (ODEs) that models the
    target and actual reward rates of each group.

    The simulation starts by generating a Pareto distributed initial wealth for
    a number of individuals. The individuals are binned into groups based on
    predefined wealth thresholds.

    The core of the simulation involves solving a system of ODEs. The equations
    represent the rate of change in the staked wealth of each group, which is a
    function of the group's current wealth and a target reward rate.

    The target reward rate for each group is a fraction of the total wealth in
    the system, proportional to each group's current wealth. The actual reward
    rate is the cumulative average of the target reward rate over time.

    These dynamics are captured by the following differential equations:

    For a group i with wealth W_i at time t, the target reward rate T_i and
    actual reward rate A_i are given by:

    > T_i(t) = rate * Σ(W) / W_i
    > A_i(t) = Σ(T_i(t)) / t

    The rate of change in the staked wealth of the group, dW_i/dt, is given by:

    > dW_i/dt = A_i(t) * W_i

    Σ(W) denotes the sum of the wealths of all groups, and Σ(T_i(t)) denotes the
    cumulative sum of the target reward rate for group i up to time t.

    The simulation tracks wealth and reward rates over time. It accounts for leap
    years when calculating the number of days per year, providing an annual
    average reward rate. The simulation runs for a total of 20 years, with a time
    step corresponding to one day.

    Results are visualized with plots of wealth evolution and reward rates over
    time. This simulation provides a model for studying wealth redistribution
    dynamics and the impact of reward mechanisms on wealth inequality (GINI).
    """

    def __init__(
        self,
        number,
        Ø_rate,
        proexp,
        alpha,
        scale,
        groups,
        t_span,
        t_step,
    ):
        """
        :param number: number of individuals
        :param Ø_rate: average reward rate
        :param proexp: progression exponent
        :param alpha: pareto shape parameter
        :param scale: pareto scale factor (to avoid empty groups)
        :param groups: group threshold values
        :param t_span: simulation time-span (in years)
        :param t_step: simulation time-step (in days)
        """
        self.number = number
        self.Ø_rate = Ø_rate
        self.proexp = proexp
        self.alpha = alpha
        self.scale = scale
        self.groups = np.array(groups)
        self.people = None
        self.pareto, self.wealth = None, None
        self.target, self.actual = None, None
        self.xronos = np.arange(t_step / 365.25, t_span, t_step / 365.25)

    def _generate_wealth(self, seed, run):
        if seed is not None:
            np.random.seed(seed * (run + 1))
        wealth = np.random.pareto(self.alpha, self.number) + 1
        wealth = wealth * self.scale
        return wealth

    def _group_wealth(self, wealth):
        bins = np.digitize(wealth, self.groups)
        groups = [np.sum(wealth[bins == i]) for i in range(len(self.groups))]
        return groups, bins

    def _group_counts(self, bins):
        groups = np.histogram(bins, bins=range(len(self.groups) + 1))[0]
        return groups * 1e0

    MIN_WEALTH = 1e0  # avoid div-by-0
    MAX_TARGET = 1e3  # avoid insanity

    def _system(self, t, W):
        target = self.Ø_rate * np.sum(W)
        target /= np.maximum(W, self.MIN_WEALTH)
        target = np.power(target, self.proexp)
        target = np.minimum(target, self.MAX_TARGET)
        actual = np.cumsum(target) / t
        return actual * W

    def run(self, seed, run):
        self.pareto = self._generate_wealth(seed, run)
        wealth, bins = self._group_wealth(self.pareto)
        self.people = self._group_counts(bins)
        span = (self.xronos[0], self.xronos[-1])
        sol = solve_ivp(self._system, span, wealth, t_eval=self.xronos)
        if not sol.success:  # simulation failure!
            return False, sol.message

        self.wealth = sol.y.T  # wealth over time
        self.target = np.empty_like(self.wealth)
        self.actual = np.empty_like(self.wealth)

        for i in range(len(self.xronos)):
            self.target[i] = self.Ø_rate * np.sum(self.wealth[i])
            self.target[i] /= np.maximum(self.wealth[i], self.MIN_WEALTH)
            self.target[i] = np.power(self.target[i], self.proexp)
            self.target[i] = np.minimum(self.target[i], self.MAX_TARGET)
            self.actual[i] = np.cumsum(self.target[i]) / self.xronos[i]

        return True, self.people, self.pareto, self.wealth, self.target, self.actual

    def print(self, args):
        if args.print_ginis:  # GINI of wealth
            gini_prt = gini_pct(self.pareto)
            gini_beg = gini_pct(self.wealth[0])
            gini_end = gini_pct(self.wealth[-1])
            gini_dff = gini_pct(self.wealth[-1], self.wealth[0])
            print("[G]", self.wealth[-1], gini_prt, gini_beg, gini_end, gini_dff)
        if args.print_people:  # GINI of *individual* wealth
            print("[P]", self.people, gini_pct(self.pareto))
        if args.print_wealth_0:  # GINI of *grouped* initial wealth
            print("[0]", self.wealth[0], gini_pct(self.wealth[0]))
        if args.print_wealth:  # GINI of *grouped* final wealth
            print("[W]", self.wealth[-1], gini_pct(self.wealth[-1]))
        if args.print_target:  # target reward rates
            print("[T]", self.target[-1])
        if args.print_actual:  # actual reward rates
            print("[A]", self.actual[-1])


###############################################################################


def gini_pct(a, b=None):
    value = gini(a) if b is None else gini(b) - gini(a)
    return "{:05.2f}%".format(100 * value)


def gini(a):
    """
    The GINI coefficient is a statistical measure of a distribution that's used
    as a gauge of inequality; returns a value in the range of [0, 1].
    """
    n = a.shape[0]
    a, i = np.sort(a), np.arange(1, n + 1)
    return np.sum(a * (2 * i - n - 1)) / (np.sum(a) * n)


def ginis(w, axis=1):
    return np.apply_along_axis(gini, axis, w)


###############################################################################
###############################################################################


class Plotter:
    """
    Plots the wealth evolution (incl. GINI coefficient) over time and plots the
    target and actual reward rates for all threshold groups.
    """

    @classmethod
    def setup(cls):
        # create ll-plot (left axis)
        cls.ll_plot = pp.subplot(1, 2, (1, 1))
        cls.ll_plot.set_xlabel("Time [Years]")
        cls.ll_plot.set_ylabel("Group Wealth [$]")
        cls.ll_plot.grid()
        # create lr-plot (right axis)
        cls.lr_plot = cls.ll_plot.twinx()
        cls.lr_plot.set_ylabel("GINI Index [%]")
        # create rt-plot (right top)
        cls.rt_plot = pp.subplot(2, 2, (2, 2))
        cls.rt_plot.set_xlabel("Time [Years]")
        cls.rt_plot.set_ylabel("Target Rates [%]")
        cls.rt_plot.grid()
        # create rb-plot (right bottom)
        cls.rb_plot = pp.subplot(2, 2, (4, 4))
        cls.rb_plot.set_xlabel("Time [Years]")
        cls.rb_plot.set_ylabel("Actual Rates [%]")
        cls.rb_plot.grid()

    @classmethod
    def show(cls):
        pp.show()

    def __init__(
        self,
        Ø_rate,
        proexp,
        groups,
        people,
        pareto,
        wealth,
        target,
        actual,
        xronos,
    ):
        """
        :param Ø_rate: average reward rate
        :param proexp: progression exponent
        :param groups: group threshold values
        :param people: number of people per group
        :param pareto: individual wealth distribution
        :param wealth: grouped wealth distribution
        :param target: target reward rates
        :param actual: actual reward rates
        :param xronos: simulation time-span
        """
        self.Ø_rate = Ø_rate
        self.proexp = proexp
        self.groups = groups
        self.people = people
        self.pareto = pareto
        self.wealth = wealth
        self.target = target
        self.actual = actual
        self.xronos = xronos
        self.colors = colors(len(groups))

    def _plot_wealth(self, run):
        """
        Plots wealth evolution for each threshold group.
        """
        self.ll_plot.set_title(
            "{:s} & {:s}".format(
                f"Wealth with Average Rate of {self.Ø_rate * 100:.2f}%",
                f"Progression Exponent of {self.proexp:.2f}",
            )
        )
        labels = []
        for i, T in enumerate(self.groups):
            self.ll_plot.semilogy(
                self.xronos,
                self.wealth[:, i],
                line(run, "-"),
                color=self.colors[i],
                alpha=alpha(run),
            )
            labels.append(
                "{:s}, {:s}".format(
                    f"Group Wealth [\$]: Max. {nice(T)} [\$/Person]",
                    f"{nice(self.people[i])} People",
                )
            )

        self.ll_plot.legend(labels, loc="upper left")

    def _plot_gini(self, run):
        """
        Plots GINI evolution across all the threshold groups.
        """
        self.lr_plot.plot(
            self.xronos,
            100 * ginis(self.wealth),
            line(run, "-."),
            color="black",
            linewidth=2,
            alpha=alpha(run),
        )

        self.lr_plot.legend(["GINI Index [%]"], loc="lower right")

    def _plot_rates(self, run):
        """
        Plots target & actual rates for each threshold group.
        """
        self.rt_plot.set_title("Target Reward Rates")
        self.rb_plot.set_title("Actual Reward Rates")
        for i, T in enumerate(self.groups):
            self.rt_plot.semilogy(
                self.xronos,
                self.target[:, i],
                line(run, "-"),
                color=self.colors[i],
                alpha=alpha(run),
            )
            self.rb_plot.semilogy(
                self.xronos,
                self.actual[:, i],
                line(run, "-"),
                color=self.colors[i],
                alpha=alpha(run),
            )

    def plot(self, run):
        self._plot_wealth(run)
        self._plot_rates(run)
        self._plot_gini(run)


###############################################################################


def line(run, lhs, rhs=":"):
    return lhs if run == 0 else rhs


def alpha(run, min_a=0.1, max_a=1.0):
    return 1 if run == 0 else max(min(1 / args.runs, max_a), min_a)


def colors(length, color_map=["r", "g", "b", "c", "m", "y"]):
    color_map.extend(cm.rainbow(np.linspace(0, 1, length)))
    return color_map


def nice(n, max_precision=3, min_precision=0):
    mm = lambda n: max(min(n, max_precision), min_precision)
    if n < 1e01:
        return ("{:." + f"{mm(3)}" + "f}U").format(n / 1e00)  # 9.000U
    if n < 1e02:
        return ("{:." + f"{mm(2)}" + "f}U").format(n / 1e00)  # 99.00U
    if n < 1e03:
        return ("{:." + f"{mm(1)}" + "f}U").format(n / 1e00)  # 999.0U
    if n < 1e04:
        return ("{:." + f"{mm(3)}" + "f}K").format(n / 1e03)  # 9.000K
    if n < 1e05:
        return ("{:." + f"{mm(2)}" + "f}K").format(n / 1e03)  # 99.00K
    if n < 1e06:
        return ("{:." + f"{mm(1)}" + "f}K").format(n / 1e03)  # 999.0K
    if n < 1e07:
        return ("{:." + f"{mm(3)}" + "f}M").format(n / 1e06)  # 9.000M
    if n < 1e08:
        return ("{:." + f"{mm(2)}" + "f}M").format(n / 1e06)  # 99.00M
    if n < 1e09:
        return ("{:." + f"{mm(1)}" + "f}M").format(n / 1e06)  # 999.0M
    if n < 1e10:
        return ("{:." + f"{mm(3)}" + "f}G").format(n / 1e09)  # 9.000G
    if n < 1e11:
        return ("{:." + f"{mm(2)}" + "f}G").format(n / 1e09)  # 99.00G
    if n < 1e12:
        return ("{:." + f"{mm(1)}" + "f}G").format(n / 1e09)  # 999.0G
    return f"{n:.3e}"


###############################################################################
###############################################################################


def cli_arguments():
    parser = argparse.ArgumentParser(description="Simulate wealth distribution.")
    parser.add_argument(
        "-n",
        "--number",
        type=int,
        default=1_000_000,
        help="number of individuals (default: %(default)s)",
    )
    parser.add_argument(
        "-r",
        "--rate",
        type=float,
        default=5.75,
        help="average reward rate percent (default: %(default)s)",
    )
    parser.add_argument(
        "-e",
        "--expo",
        type=float,
        default=1.5,
        help="progression exponent (default: %(default)s)",
    )
    parser.add_argument(
        "-a",
        "--alpha",
        type=float,
        default=1.5,
        help="pareto distribution shape (default: %(default)s)",
    )
    parser.add_argument(
        "-s",
        "--scale",
        type=float,
        default=0.5,
        help="pareto distribution scale (default: %(default)s)",
    )
    parser.add_argument(
        "-g",
        "--groups",
        type=float,
        nargs="+",
        default=[1e0, 1e3, 1e6],
        help="group thresholds (default: %(default)s)",
    )
    parser.add_argument(
        "-y",
        "--time-span",
        type=float,
        default=20.0,
        help="simulation span in years (default: %(default)s)",
    )
    parser.add_argument(
        "-d",
        "--time-step",
        type=float,
        default=1,
        help="simulation step in days (default: %(default)s)",
    )
    parser.add_argument(
        "-S",
        "--seed",
        type=int,
        default=None,
        help="randomization seed (default: %(default)s)",
    )
    parser.add_argument(
        "-R",
        "--runs",
        type=int,
        default=1,
        help="simulation runs (default: %(default)s)",
    )
    parser.add_argument(
        "-P",
        "--print-people",
        action="store_true",
        help="print number of group members (default: %(default)s)",
    )
    parser.add_argument(
        "-0",
        "--print-wealth-0",
        action="store_true",
        help="print wealth initial with GINI (default: %(default)s)",
    )
    parser.add_argument(
        "-W",
        "--print-wealth",
        action="store_true",
        help="print wealth final with GINI (default: %(default)s)",
    )
    parser.add_argument(
        "-G",
        "--print-ginis",
        action="store_true",
        help="print wealth final with GINIs (default: %(default)s)",
    )
    parser.add_argument(
        "-T",
        "--print-target",
        action="store_true",
        help="print target rates (default: %(default)s)",
    )
    parser.add_argument(
        "-A",
        "--print-actual",
        action="store_true",
        help="print actual rates (default: %(default)s)",
    )
    parser.add_argument(
        "-K",
        "--skip-plots",
        action="store_true",
        help="skip-plots (default: %(default)s)",
    )
    return parser.parse_args()


###############################################################################


def main(args, run):
    # simulate distribution
    sim = Simulator(
        args.number,
        args.rate / 100.0,
        args.expo,
        args.alpha,
        args.scale,
        args.groups,
        args.time_span,
        args.time_step,
    )
    ok, *rest = sim.run(args.seed, run)
    if not ok:
        print("[E]", rest[0])
        return
    people, pareto, wealth, target, actual = rest
    sim.print(args)

    # plot distribution & rates
    if args.skip_plots:
        return
    graph = Plotter(
        args.rate / 100.0,
        args.expo,
        args.groups,
        people,
        pareto,
        wealth,
        target,
        actual,
        sim.xronos,
    )
    graph.plot(run)


###############################################################################
###############################################################################

if __name__ == "__main__":
    args = cli_arguments()
    if not args.skip_plots:
        Plotter.setup()
    for run in range(args.runs):
        main(args, run)
    if not args.skip_plots:
        Plotter.show()

###############################################################################
###############################################################################
