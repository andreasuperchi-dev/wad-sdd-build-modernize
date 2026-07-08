import { createApp } from "./http/app.js";

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`Duck Emporium listening on http://localhost:${port}`);
});
