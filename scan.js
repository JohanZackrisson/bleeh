var noble = require("noble");

var moment = require("moment");

function tryPairing(peripheralUuid) {
    console.log(noble._bindings);
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

var uuid = function(uuid_with_dashes) {
  return uuid_with_dashes.replace(/-/g, '');
};

const rfcommuuid = uuid("6e400001-b5a3-f393-e0a9-e50e24dcca9e")
const rfcommuuid_tx = uuid("6e400002-b5a3-f393-e0a9-e50e24dcca9e")
const rfcommuuid_rx = uuid("6e400003-b5a3-f393-e0a9-e50e24dcca9e")

const sonySmartbandService = uuid("00000200-37cb-11e3-8682-0002a5d5c51b")

function startScanning() {
    console.log("started scanning");
    noble.startScanning([]); // any service UUID, allow duplicates
}

function armbandCharacteristics(error, characteristics) {
    //console.log(error, characteristics)
    if (error) { throw new Error("failed to find characteristic");}

    characteristics.map( (characteristic) => {
        switch(characteristic.uuid) {
            case "2a37":
                console.log("char: 2a37");
                /*characteristic.on("data", (data, isNotification) => {
                    console.log("data", data, isNotification)
                })*/

                characteristic.on("data", (data, isNotification) => {
                    const nowTime = moment().format();
                    const bePulse = data.readUInt16BE();
                    console.log("pulse data", nowTime, bePulse);
                });

                characteristic.on("notify", (state) => {
                    console.log("notify", state);
                });

                console.log("subscribing...");
                characteristic.subscribe((error) => {
                    if (error) { throw new Error("failed to subscribe");}
                });

                return;
            case "2a38":
                console.log("char: 2a38");
                characteristic.read((error, data) => {
                    if (error) { throw new Error("Can't read sensor location");}
                    console.log(data);
                });
                return;
            case "2a39":
            default:
                console.log(characteristic);
        }
    });
}

function batteryCharacteristics(error, characteristics) {
    if (error) { throw new Error("failed to find characteristic");}
    characteristics.map( (characteristic) => {
        switch(characteristic.uuid) {
            case "2a19":
                console.log("battery");
                characteristic.on("data", (data, isNotification) => {
                    console.log(data);
                });

                characteristic.subscribe((error) => {
                    if (error) { throw new Error("failed to subscribe");}
                    console.log("subscribed battery levels");
                });
            break;
            default:
                console.log(characteristic);
            break;
        }
    });
}

let tfcommTransmit = null

function rfCommCharacteristics(error, characteristics) {
    characteristics.map( (characteristic) => {
        switch(characteristic.uuid) {
            case rfcommuuid_tx:
                tfcommTransmit = characteristic
            break;
            case rfcommuuid_rx:
                characteristic.notify(true)
                characteristic.subscribe((error) => {
                    if (error) { throw new Error("failed to subscribe");}
                    console.log("subscribed to rfcomm");
                });

                characteristic.on("data", (data, isNotification) => {
                    console.log("rfcomm data", data);
                });
            break;
            default:
                console.log("unknown rfcomm uuid: ", characteristic.uuid)
                break;
        }
    })
}

const PROTOCOL_VERSION_UUID = uuid( "00000201-37cb-11e3-8682-0002a5d5c51b" );
// version is 0x06
const MODE_UUID             = uuid( "00000202-37cb-11e3-8682-0002a5d5c51b" );
// 0x00 normal mode
// 0x03 seams to be continuous measurement mode

const DATA_UUID             = uuid( "00000203-37cb-11e3-8682-0002a5d5c51b" );
const NOTIFICATION_UUID     = uuid( "00000204-37cb-11e3-8682-0002a5d5c51b" );
const USER_TARGET_UUID      = uuid( "00000205-37cb-11e3-8682-0002a5d5c51b" );
const ALARM_UUID            = uuid( "00000206-37cb-11e3-8682-0002a5d5c51b" );
const ACCEL_DATA_UUID       = uuid( "00000207-37cb-11e3-8682-0002a5d5c51b" );
const CURRENT_TIME_UUID     = uuid( "00000208-37cb-11e3-8682-0002a5d5c51b" );
const EVENT_UUID            = uuid( "00000209-37cb-11e3-8682-0002a5d5c51b" );
const CONTROL_POINT_UUID    = uuid( "00000210-37cb-11e3-8682-0002a5d5c51b" );
const DEBUG_UUID            = uuid( "00000211-37cb-11e3-8682-0002a5d5c51b" );
const AUTO_NIGHT_MODE_UUID  = uuid( "00000212-37cb-11e3-8682-0002a5d5c51b" );
const UNKNOWN_1             = uuid( "0000020a-37cb-11e3-8682-0002a5d5c51b" );
const UNKNOWN_2             = uuid( "0000020b-37cb-11e3-8682-0002a5d5c51b" );
const UNKNOWN_3             = uuid( "0000020c-37cb-11e3-8682-0002a5d5c51b" );

let sonyCharacteristics = null

function sonySmartbandCharacteristics(error, characteristics) {
    sonyCharacteristics = {}
    characteristics.map( (characteristic) => {
        console.log(characteristic.toString())
        
        switch(characteristic.uuid) {
            case USER_TARGET_UUID:
                characteristic.notify(true);
                characteristic.on("data", (data, isNotification) => {
                    console.log("button data", data);
                });
                break;

            case ACCEL_DATA_UUID:
            case PROTOCOL_VERSION_UUID:
            case MODE_UUID:
            case DATA_UUID:
            case NOTIFICATION_UUID:
            case ALARM_UUID:
            case CURRENT_TIME_UUID:
            case EVENT_UUID:
            case CONTROL_POINT_UUID:
            case DEBUG_UUID:
            case AUTO_NIGHT_MODE_UUID:
            case UNKNOWN_1:
            case UNKNOWN_2:
            case UNKNOWN_3:
                sonyCharacteristics[characteristic.uuid] = characteristic
                break;
            default:
                console.log("unknown sony characteristic: ", characteristic.uuid)
                break;
        }
    })
}

function onDisconnect() {
    tfcommTransmit = null
    sonyCharacteristics = null
    noble.startScanning();
}

function dummyRead(id, error, data) {
    console.log(id, error, data)
}

let test = 1

let read = true

setInterval( () => {
    if (tfcommTransmit) {
        const data = new Buffer("\r\nRING\r\n")
        console.log(data)
        tfcommTransmit && tfcommTransmit.write(data, false)
        console.log("wrote to rfcomm")
    }

    if (sonyCharacteristics) {
        //sonyCharacteristics[UNKNOWN_1].read((error, data) => dummyRead(UNKNOWN_1, error, data))

        // time?
        //sonyCharacteristics[UNKNOWN_2].read((error, data) => dummyRead(UNKNOWN_2, error, data))

        //sonyCharacteristics[UNKNOWN_3].read((error, data) => dummyRead(UNKNOWN_3, error, data))
        if (read) {
            sonyCharacteristics[NOTIFICATION_UUID].read((error, data) => dummyRead(NOTIFICATION_UUID, error, data))
        } else {
            sonyCharacteristics[NOTIFICATION_UUID].write(new Buffer([0x00, 0x00, 0x00, 0x20], true))
            //sonyCharacteristics[NOTIFICATION_UUID].write(new Buffer([0x00, 0x00, 0x00, 0x40], false))
            test++;
        }
        
        sonyCharacteristics[ALARM_UUID].read((error, data) => dummyRead(ALARM_UUID, error, data))
        console.log(test)
        
        read = !read
    }

}, 5000)

function connectToArmband(peripheral) {
    noble.stopScanning();
    console.log("what can we do with this thing..");

    setTimeout( () => {
        console.log("trying to connect");
        peripheral.connect( (error) => {
            console.log("connected");

            peripheral.once("disconnect", () => onDisconnect);


            /*peripheral.discoverAllServicesAndCharacteristics( (error, services, characteristics) => {
                console.log(error, services, characteristics)
                if (error) { throw new Error("failed to find services") }

            })*/

            peripheral.discoverServices(
                [sonySmartbandService, /*rfcommuuid , "180d", "180f"*/], function(error, services) {
                    if (error) { throw new Error("failed to find services"); }
                    console.log("discovered services: ", error, services);
                    services.map( (service) => {
                        console.log("uuid: ", service.uuid);
                        switch(service.uuid) {
                            case "180d":
                                service.discoverCharacteristics(["2a37", "2a38", "2a39"], armbandCharacteristics);
                                break;
                            case "180f":
                                service.discoverCharacteristics(["2a19"], batteryCharacteristics);
                                break;
                            case rfcommuuid:
                                service.discoverCharacteristics([], rfCommCharacteristics)
                                break;

                            case sonySmartbandService:
                                service.discoverCharacteristics([], sonySmartbandCharacteristics);
                                break;

                            default:
                                console.log(`unknown service '${service.uuid}'`)
                                break;
                        }
                        //console.log("service: ", service)

                    });

                }
            );
        });
    }, 2000);

}

function connectToPolar(peripheral) {
    console.log("connecting...");
    //tryPairing(peripheral.uuid)


    //return

    peripheral.connect( (error) => {
        console.log("connected with error: " + error);

        /*peripheral.discoverServices([], (error, services) => {
            console.log(error)
            console.log(services)
        })*/

        /*peripheral.discoverAllServicesAndCharacteristics( (error, services, characteristic) => {
            console.log("error :" + error)
            console.log(services)
            console.log(characteristic)
        })*/
    });
}

noble.on("data", (state) => {
    console.log(state);
});

noble.on("stateChange", (state) => {
    console.warn(state);

    if (state === "poweredOn") {
        startScanning( [rfcommuuid] /*, "180d", "180f"], false */);
    }
});

noble.on("discover", (peripheral) => {

    switch(peripheral.uuid) {
        case "a0602aa9d6284bb0a3b513da121dac60":
            console.warn("ALARM!");
            console.log(peripheral.advertisement.manufacturerData);
            /*peripheral.discoverAllServicesAndCharacteristics( (error, services, characteristic) => {
                console.log("error :" + error)
                console.log(services)
                console.log(characteristic)
            })*/
            return;
        break;
    }

    console.log("Found: " + JSON.stringify(peripheral.advertisement, null, "\t"));
    console.log(peripheral);

    switch(peripheral.advertisement.localName)
    {
        case "Zetas":
            return;
        case "Polar A360 9957D418":
            connectToPolar(peripheral);
            return;
        case "SWR12":
            return connectToArmband(peripheral);
    }

});

