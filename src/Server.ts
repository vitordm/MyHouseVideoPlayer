import { GlobalAcceptMimesMiddleware, ServerLoader, ServerSettings } from "@tsed/common";
import * as bodyParser from "body-parser";
import * as compress from "compression";
import * as cookieParser from "cookie-parser";
import * as methodOverride from "method-override";
import * as cors from "cors";
import "@tsed/ajv";
import "@tsed/swagger";
import "@tsed/typeorm";
import typeormConfig from "./config/typeorm";

const cons = require("consolidate");

const rootDir = __dirname;

@ServerSettings({
  rootDir,
  viewsDir: `${rootDir}/views`,
  statics: {
    '/': `${rootDir}/../public`
  },
  acceptMimes: ["application/json"],
  httpPort: process.env.PORT || 8083,
  httpsPort: false, // CHANGE
  mount: {
    '/': [
      `${rootDir}/controllers/**/*.ts`
    ]
  },
  swagger: [
    {
      path: "/docs"
    }
  ],
  typeorm: typeormConfig,
  exclude: [
    "**/*.spec.ts"
  ]
})
export class Server extends ServerLoader {
  $beforeInit() {
    this.set("views", this.settings.get("viewsDir")); // le repertoire des vues
    this.engine("ejs", cons.ejs);
  }

  $beforeRoutesInit() {
    this
      .use(cors())
      .use(GlobalAcceptMimesMiddleware)
      .use(cookieParser())
      .use(compress({}))
      .use(methodOverride())
      .use(bodyParser.json())
      .use(bodyParser.urlencoded({
        extended: true
      }));

    return null;
  }
}
