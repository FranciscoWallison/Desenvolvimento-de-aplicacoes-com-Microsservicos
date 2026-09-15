import { register as navigation } from "./navigation.js";
import { register as inspect } from "./inspect.js";
import { register as interaction } from "./interaction.js";
import { register as evidence } from "./evidence.js";
import { register as download } from "./download.js";
import { register as human } from "./human.js";

export function registerAll(server) {
  navigation(server);
  inspect(server);
  interaction(server);
  evidence(server);
  download(server);
  human(server);
}
