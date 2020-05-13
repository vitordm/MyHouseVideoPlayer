import { Controller, Get, Render } from "@tsed/common";

@Controller("/hello-world")
export class HelloWorldController {
  @Get("/")
  get() {
    return "hello";
  }

  @Get("/:id")
  @Render("eventCard.ejs")
  public montar(): any {
    return { startDate: new Date(), name: "MyEvent" };
  }
}
