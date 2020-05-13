import { $log, ServerLoader } from "@tsed/common";
import { Server } from "./Server";

async function bootstrap() {
  try {
    $log.debug("Start server...");
    console.log(`PID ==============> ${process.pid}`);
    const server = await ServerLoader.bootstrap(Server);

    await server.listen();
    $log.debug("Server initialized");
  } catch (er) {
    $log.error(er);
  }
}

bootstrap();
