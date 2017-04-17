var noble = require('noble');


function tryPairing(peripheralUuid) {
    console.log(noble._bindings)
    //console.log(noble._bindings._addresses[peripheralUuid]) 
}
/*NobleBindings.prototype.connect = function(peripheralUuid) {
  var address = this._addresses[peripheralUuid];
  var addressType = this._addresseTypes[peripheralUuid];

  if (!this._pendingConnectionUuid) {
    this._pendingConnectionUuid = peripheralUuid;

    this._hci.createLeConn(address, addressType);
  } else {
    this._connectionQueue.push(peripheralUuid);
  }
};*/

function startScanning() {
    console.log("started scanning")
    noble.startScanning([]); // any service UUID, allow duplicates
}

function connectToArmband(peripheral) {
    noble.stopScanning()
    console.log("what can we do with this thing..")


    peripheral.connect( (error) => {
        console.log("connected")

        peripheral.discoverServices(["180d"],
            function(error, services) {
            console.log(error, services, characteristics)
        }
    )
    })

    

}

function connectToPolar(peripheral) {
    console.log("connecting...");
    //tryPairing(peripheral.uuid)
    

    //return

    peripheral.connect( (error) => {
        console.log("connected with error: " + error)

        /*peripheral.discoverServices([], (error, services) => {
            console.log(error)
            console.log(services)
        })*/

        /*peripheral.discoverAllServicesAndCharacteristics( (error, services, characteristic) => {
            console.log("error :" + error)
            console.log(services)
            console.log(characteristic)
        })*/
    })
}

noble.on('stateChange', (state) => {
    console.warn(state)

    if (state === "poweredOn") {
        startScanning()
    }
})

noble.on('discover', (peripheral) => {

    switch(peripheral.uuid) {
        case "a0602aa9d6284bb0a3b513da121dac60":
            console.warn("ALARM!")
            console.log(peripheral.advertisement.manufacturerData)
            /*peripheral.discoverAllServicesAndCharacteristics( (error, services, characteristic) => {
                console.log("error :" + error)
                console.log(services)
                console.log(characteristic)
            })*/
            return;
        break;
    }

    console.log("Found: " + JSON.stringify(peripheral.advertisement, null, "\t"))
    console.log(peripheral)

    switch(peripheral.advertisement.localName)
    {
        case "Zetas":
            return;
        case "Polar A360 9957D418":
            connectToPolar(peripheral);
            return
        case "SWR12":
            return connectToArmband(peripheral)
    }
    
})

