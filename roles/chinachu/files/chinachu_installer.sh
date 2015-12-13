#!/usr/bin/expect
spawn ./chinachu installer
expect "what do you install? >"
send "1\n"
interact

