#!/usr/bin/env python
#######################################################################
"""
This script reads from the input, counts the number of lines-per-second,
and then calculates and appends the lines-per-second rate to each line.
"""

import time

#######################################################################
#######################################################################


def lines_per_second():
    """
    Counts the number of lines read from the input per second, and
    prints the rate. It continuously reads from the input, and for
    every one second interval, it calculates average rate.
    """
    lines = 0
    old_time = time.time()

    for line in iter(input, ""):
        lines += 1
        new_time = time.time()
        if new_time - old_time >= 1.0:
            lines_s = lines / (new_time - old_time)
            print(f"{line} {lines_s:.3f} [L/S]")
            lines, old_time = 0, new_time


#######################################################################

if __name__ == "__main__":
    try:
        lines_per_second()
    except KeyboardInterrupt:
        pass

#######################################################################
#######################################################################
