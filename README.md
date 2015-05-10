# WebRTC Data Channel Playground
This playground contains testing tools for WebRTC Data Channels. Some are useful for measurements, some are demos and some may not work.

## Our Tools
### [Netperfmeter](https://cdn.rawgit.com/nplab/WebRTC-Datachannel-Playground/master/netperfmeter/netperfmeter.html)
Netperfmeter is a perfomance meter for the WebRTC Data Channels. It simultaneously transmits unidirectional data via Data Channels to a peer and measures the resulting bandwith for each Data Channel. 

Each Data Channel can be configured seperately.

This tool is port of Thomas Dreibholz's [Netperfmeter](https://www.uni-due.de/~be0001/netperfmeter/).

### [Browsertests](https://cdn.rawgit.com/nplab/WebRTC-Datachannel-Playground/master/conformance-tests/conformance-tests.html)
Browsertests check the implementation of WebRTC Data Channels via a collection of tests according to the [W3C Specification](http://www.w3.org/TR/webrtc/).

### [Stresstest](https://cdn.rawgit.com/nplab/WebRTC-Datachannel-Playground/master/stresstest/stresstest.html)
Stresstest to create multiple local Peer-Connections containing multiple Data Channels which are sending messages.

### [Gyrocolor](https://cdn.rawgit.com/nplab/WebRTC-Datachannel-Playground/master/gyrocolor/gyrocolor.html)
If available, the client changes the servers background color in dependence of its gyro-sensor values.

### [Speedtest](https://cdn.rawgit.com/nplab/WebRTC-Datachannel-Playground/master/speedtest/speedtest.html)
Speedtest - runtime and message-size are configurable. 

## Trace Data Channel in Wireshark
You can trace traffic with Wireshark on Firefox and Chrome (nightly) - tutorial is [here](https://github.com/nplab/WebRTC-Data-Channel-Playground/wiki/Analyze-Data-Channel-traffic-with-Wireshark).

## Contact & Feedback
We like feedback! :)
  Feel free to report bugs or ideas to us!

Project maintainer:<br/>Felix Weinrank - weinrank@fh-muenster.de


