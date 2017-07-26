
var dctests = {
    "PC": {
        "description": "Check if RTCPeerConnection is available",
        "sync": true,
        "test_function": _testDCPC
    },
    "label003": {
        "parameters": {
            "label": "test-label漢字"
        },
        get description() {
            return "Create a DataChannel with label \"" + this.parameters.label + "\" - check the label on both peers";
        },
        "sync": false,
        "test_function": _testDC_label003
    }
};

function run_dctest(name, attr) {
    if (attr.sync) {
        test(function() {
                attr.test_function(attr.parameters);
            }, name + ' - ' + attr.description, {
                timeout: attr.timeout
            }
        );
    } else {
        var atest = async_test(name + ' - ' + attr.description, {
            timeout: attr.timeout}
        );
        atest.step(function() {
            attr.test_function(atest, attr.parameters);
        });
    }
}

