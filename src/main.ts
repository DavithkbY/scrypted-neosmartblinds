import axios from 'axios';
import sdk, { DeviceProvider, DeviceCreatorSettings, Entry, EntrySensor, ScryptedDeviceBase, ScryptedDeviceType, ScryptedInterface, DeviceInformation, Setting, Settings, DeviceCreator, SettingValue } from '@scrypted/sdk';
const { deviceManager } = sdk;


class NeosmartBlind extends ScryptedDeviceBase implements Entry, EntrySensor, Settings {
    timeout: NodeJS.Timeout;

    constructor(nativeId: string, provider?: DeviceProvider) {
        super(nativeId);
        this.entryOpen = this.entryOpen || false;
    }

    async getSettings(): Promise<Setting[]> {
        return [
            {
                key: 'shadeName',
                title: 'Shade name',
                value: this.storage.getItem('shadeName'),
            },
            {
                key: 'password',
                title: 'Password',
                type: 'password',
                value: this.storage.getItem('password'),
            },
            {
                key: 'ip',
                title: 'Host IP Address',
                placeholder: '192.168.2.222',
                value: this.storage.getItem('ip'),
            },
            {
                key: 'port',
                title: 'Host port',
                description: "The port number (usually 8838)",
                placeholder: '8838',
                type: 'number',
                value: this.storage.getItem('port'),
            },
            {
                key: 'blindCode',
                title: 'Blind Code',
                value: this.storage.getItem('blindCode'),
            },
            {
                key: 'motorCode',
                title: 'Motor Code',
                value: this.storage.getItem('motorCode'),
            },
            {
                key: 'parentGroup',
                title: 'Parent Group',
                value: this.storage.getItem('parentGroup'),
            },
        ]
    }
    async putSetting(key: string, value: SettingValue): Promise<void> {
        this.storage.setItem(key, value.toString());
        clearTimeout(this.timeout);
    }

    async openEntry() {
        this.console.log('Open was called!');
        this.entryOpen = true;
    }
    async closeEntry() {
        this.console.log('Close was called!');
        this.entryOpen = false;
    }
}

class MyDeviceProvider extends ScryptedDeviceBase implements DeviceProvider, DeviceCreator {

    devices = new Map<string, NeosmartBlind>();

    constructor(nativeId?: string) {
        super(nativeId);

        for (const shadeId of deviceManager.getNativeIds()) {
            if (shadeId)
                this.getDevice(shadeId);
        }
    }

    async getDevice(nativeId: string) {
        let ret = this.devices.get(nativeId);
        if (!ret) {
            ret = new NeosmartBlind(nativeId);

            // remove legacy scriptable interface
            if (ret.interfaces.includes(ScryptedInterface.Scriptable)) {
                setTimeout(() => this.onDiscovered(ret.nativeId, ret.providedName), 2000);
            }

            if (ret)
                this.devices.set(nativeId, ret);
        }
        return ret;
    }


    async releaseDevice(id: string, nativeId: string): Promise<void> {

    }


    // After the lights are discovered, Scrypted will request the plugin create the
    // instance that can be used to control and query the light.


    async createDevice(settings: DeviceCreatorSettings): Promise<string> {

        const shadeName = settings.shadeName?.toString();
        const password = settings.password?.toString();
        const ip = settings.ip?.toString();
        const port = settings.port?.toString();
        const blindCode = settings.blindCode?.toString();
        const motorCode = settings.motorCode?.toString();
        const parentGroup = settings.parentGroup?.toString();

        if (shadeName! && password! && ip! && port! && blindCode! && motorCode! && parentGroup!) {
            const nativeId = 'shell:' + Math.random().toString();
            const name = settings.name?.toString();

            await this.onDiscovered(nativeId, name);

            const device = await this.getDevice(nativeId);
            device.putSetting('shadeName', settings.shadeName);
            device.putSetting('password', settings.password);
            device.putSetting('ip', settings.ip);
            device.putSetting('port', settings.port);

            device.putSetting('blindCode', settings.blindCode);
            device.putSetting('motorCode', settings.motorCode);
            device.putSetting('parentGroup', settings.parentGroup);
            return nativeId;
        }
        else {
            return null;
        }


    }

    async onDiscovered(nativeId: string, name: string) {
        await deviceManager.onDeviceDiscovered({
            nativeId,
            name,
            interfaces: [
                ScryptedInterface.Settings,
                ScryptedInterface.Entry,
                ScryptedInterface.EntrySensor,
            ],
            type: ScryptedDeviceType.Entry,
        });
    }

    async getCreateDeviceSettings(): Promise<Setting[]> {
        return [
            {
                key: 'shadeName',
                title: 'Shade name',
            },
            {
                key: 'password',
                title: 'Password',
                type: 'password',
            },
            {
                key: 'ip',
                title: 'Host IP Address',
                placeholder: '192.168.2.222',
            },
            {
                key: 'port',
                title: 'Host port',
                description: "The port number (usually 8838)",
                placeholder: '8838',
                type: 'number',
            },
            {
                key: 'blindCode',
                title: 'Blind Code'
            },
            {
                key: 'motorCode',
                title: 'Motor Code'
            },
            {
                key: 'parentGroup',
                title: 'Parent Group'
            },
        ]
    }

}

// Export the provider from the plugin, rather than the individual light.
export default MyDeviceProvider;