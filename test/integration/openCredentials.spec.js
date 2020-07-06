const MemoryDatasource = require("../../dist/datasources/MemoryDatasource.js");
const { registerDatasource } = require("../../dist/datasources/register.js");
const VaultManager = require("../../dist/core/VaultManager.js");
const VaultSource = require("../../dist/core/VaultSource.js");
const Credentials = require("../../dist/credentials/Credentials.js");

class FakeDatasource extends MemoryDatasource {
    constructor(creds) {
        super(creds);
        this.type = "fake";
        this.extractedData = creds.getData();
    }
}

describe("VaultSource with custom datasource", function() {
    beforeEach(async function() {
        this.datasourceTypeDefault = `fake-datasource-default-${Math.floor(Math.random() * 999999)}`;
        this.datasourceTypeOpen = `fake-datasource-open-${Math.floor(Math.random() * 999999)}`;
        registerDatasource(this.datasourceTypeDefault, FakeDatasource);
        registerDatasource(this.datasourceTypeOpen, FakeDatasource, {
            open: true
        });
        this.vaultManager = new VaultManager();
        const credsOpen = Credentials.fromDatasource(
            {
                type: this.datasourceTypeOpen,
                property: `test-${Math.floor(Math.random() * 999999)}`
            },
            "test"
        );
        const credsDefault = Credentials.fromDatasource(
            {
                type: this.datasourceTypeDefault,
                property: `test-${Math.floor(Math.random() * 999999)}`
            },
            "test"
        );
        const credsOpenStr = await credsOpen.toSecureString();
        const credsDefaultStr = await credsDefault.toSecureString();
        this.vaultSourceOpen = new VaultSource("test", this.datasourceTypeOpen, credsOpenStr);
        this.vaultSourceDefault = new VaultSource("test", this.datasourceTypeDefault, credsDefaultStr);
        await this.vaultManager.addSource(this.vaultSourceOpen);
        await this.vaultManager.addSource(this.vaultSourceDefault);
        await this.vaultSourceOpen.unlock(Credentials.fromPassword("test"), {
            initialiseRemote: true
        });
        await this.vaultSourceDefault.unlock(Credentials.fromPassword("test"), {
            initialiseRemote: true
        });
    });

    it("provides open credentials on unlock", function() {
        const { _datasource: datasource } = this.vaultSourceOpen;
        expect(datasource.extractedData).to.have.property("masterPassword", "test");
        expect(datasource.extractedData).to.have.property("open", true);
    });

    it("provides closed credentials by default", function() {
        const { _datasource: datasource } = this.vaultSourceDefault;
        expect(datasource.extractedData).to.be.null;
    });
});
