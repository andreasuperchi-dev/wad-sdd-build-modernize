import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createAdminRouter, UNAUTHORIZED_ERROR } from "./admin.route.js";

afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
});

describe("admin route", () => {
  it("returns 401 when admin password is missing or invalid", async () => {
    process.env.ADMIN_PASSWORD = "secret";
    const app = express();
    app.use(express.json());
    app.use(createAdminRouter({ addDuck: async () => ({ duck: {} as never }) } as never));

    const response = await request(app).post("/admin/ducks").send({ name: "New Duck" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: UNAUTHORIZED_ERROR });
  });

  it("returns 201 with created duck on success", async () => {
    process.env.ADMIN_PASSWORD = "secret";
    const app = express();
    app.use(express.json());

    app.use(
      createAdminRouter({
        addDuck: async () => ({
          duck: {
            id: "duck-new",
            name: "New Duck",
            category: "Adventurer",
            price: 10,
            tagline: "tagline",
            description: "description",
            personalityTraits: ["curious"],
            stock: 2,
          },
        }),
      } as never),
    );

    const response = await request(app)
      .post("/admin/ducks")
      .set("x-admin-password", "secret")
      .send({ name: "New Duck" });

    expect(response.status).toBe(201);
    expect(response.body.duck.name).toBe("New Duck");
  });

  it("maps service validation and conflict errors", async () => {
    process.env.ADMIN_PASSWORD = "secret";
    const app = express();
    app.use(express.json());
    app.use(createAdminRouter({ addDuck: async () => ({ status: 409, error: "Duck name already exists" }) } as never));

    const response = await request(app)
      .post("/admin/ducks")
      .set("x-admin-password", "secret")
      .send({ name: "Duplicate" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "Duck name already exists" });
  });
});
