---
layout: '@layouts/Blog/BaseLayout.astro'
title: SIMCOM GSM module SIM card detection issues
author: Gideon Maina
updated: 2024-02-11 09:57:32Z
created: 2024-01-23 06:40:06Z
latitude: -1.29206590
longitude: 36.82194620
---

# SIM card detection issues with SIM900/SIM800

I noticed that at some point when working with SIM900 chip from [SIMCOM](https://simcom.com), the SIM card was not being detected any longer. The SIM card was never removed from the tray during my tinkering. I suspect the frequent connections/disconnections to the USB port for serial monitoring/debugging had something to do with it.

# Error detection

A simple run of the AT command `AT+CCID` or `AT+CPIN?` will give an undesired error result.

## Solution

A soft reset using the AT command `AT+CFUN=1` solved the issue. What this command does is reset the GSM chip to full functionality.

P.S. The AT command `AT+CFUN=0` will not work. This command essentially shuts down the GSM chip.