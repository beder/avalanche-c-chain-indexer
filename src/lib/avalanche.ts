import { Avalanche } from "@avalabs/avalanchejs";
import { EVMAPI } from "@avalabs/avalanchejs/dist/apis/evm";

const avalanche = new Avalanche("api.avax.network", 443, "https");
const cchain = new EVMAPI(avalanche, "/ext/bc/C/rpc");

export { avalanche, cchain };
