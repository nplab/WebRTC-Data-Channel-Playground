# WebRTC Data Channel Playground
This playground contains testing tools for WebRTC Data Channels.
Some are useful for measurements, some are demos and some may not work.

## Our Tools
### [Netperfmeter](https://rawgit.com/nplab/WebRTC-Datachannel-Playground/master/netperfmeter/netperfmeter.html)
Netperfmeter is a performance measurement tool for the WebRTC Data Channels.
It simultaneously transmits unidirectional data via Data Channels to a peer and measures the resulting bandwidth for each Data Channel.

Each Data Channel can be configured separately.

This tool is port of Thomas Dreibholz's [Netperfmeter](https://www.uni-due.de/~be0001/netperfmeter/).

### [Browsertests](https://rawgit.com/nplab/WebRTC-Datachannel-Playground/master/conformance-tests/conformance-tests.html)
Browsertests checks the implementation of WebRTC Data Channels via a collection of tests according to the [W3C Specification](http://www.w3.org/TR/webrtc/).

### [Stresstest](https://rawgit.com/nplab/WebRTC-Datachannel-Playground/master/stresstest/stresstest.html)
Stresstest to create multiple local Peer-Connections containing multiple Data Channels which are sending messages.

### [Gyrocolor](https://rawgit.com/nplab/WebRTC-Datachannel-Playground/master/gyrocolor/gyrocolor.html)
The two peers exchange the values of their gyro sensors.
A local peer changes its background color (R,G,B) in relation to the peers sensor values.

### [Speedtest](https://rawgit.com/nplab/WebRTC-Datachannel-Playground/master/speedtest/speedtest.html)
Speedtest - runtime and message size are configurable.

## Trace with Wireshark
You can trace and analyze WebRTC by using Wireshark.
### 1. Prerequisite
Get [Wireshark](https://www.wireshark.org/) with [text2pcap](https://www.wireshark.org/docs/man-pages/text2pcap.html) (included by default).

### 2.a - Log with Mozilla Firefox
Set environment variables

`NSPR_LOG_MODULES` to `SCTP:5,DataChannel:5`
`NSPR_LOG_FILE` to `/Users/username/logfile` << change path

A tutorial for setting variables on different platforms is [here](https://wiki.mozilla.org/MailNews:Logging#Generating_a_Protocol_Log).

### 2.b - Log with Chrome (darkest nightly with patch)
Start Chrome with additional parameters: `--enable-logging --v=4`
Chrome will log file. For example `chrome_debug.log`

### 3. Extract SCTP information from logfile
```
grep SCTP_PACKET logfile > sctp.log
```

### 4. text2pcap
```
text2pcap -n -l 248 -D -t '%H:%M:%S.' sctp.log sctp.pcapng
```

### 5. Wireshark
Open `sctp.pcapng` in Wireshark.

### 6. Sample Script
```
#!/bin/sh
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
echo $SCRIPTPATH

export NSPR_LOG_MODULES=SCTP:5,DataChannel:5
export NSPR_LOG_FILE=$SCRIPTPATH/firefoxlog

/Applications/Firefox.app/Contents/MacOS/firefox-bin
grep SCTP_PACKET firefoxlog.child-1 > sctp.log
text2pcap -n -l 248 -D -t '%H:%M:%S.' sctp.log sctp.pcapng
```

## Turnserver
To start a WebRTC compatible turn server:
```
turnserver -L <listening-ip-addr> -a -v -n -r realm -u user:password -p <port>
```

## Contact & Feedback
We like feedback! :)
Feel free to report bugs or ideas to us!

Project maintainer:<br/>Felix Weinrank - weinrank@fh-muenster.de
