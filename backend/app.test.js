const request = require("supertest");
const app = require("./server");


describe("Tests de la route /login", () => {

    test("Connexion réussie", async () => {

        const response = await request(app)
            .post("/login")
            .send({
                username: "admin",
                password: "docker"
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

    });

    test("Connexion refusée", async () => {

        const response = await request(app)
            .post("/login")
            .send({
                username: "lola",
                password: "123"
            });
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Identifiants incorrects.");
    });

    test("Connexion refusée, body vide", async () => {
        const response = await request(app)
            .post("/login")
            .send({})
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Identifiants incorrects.");
    });

    test("Connexion refusée, password manquant", async () => {
      const response = await request(app)
          .post("/login")
          .send({
              username: "admin"
          });
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Identifiants incorrects.");
    });

    test("Connexion refusée, username manquant", async () =>{
      const response = await request(app)
          .post("/login")
          .send({
              password: "docker"
          });
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Identifiants incorrects.");
    });
});

describe("Tests de la route /click", () => {

    test("Premier clic", async () => {

      const response = await request(app)
          .post("/click")
          .send({
              count:1

          });

    expect(response.status).toBe(200);

    });

    test("Deuxième clic", async () => {

      const response = await request(app)
          .post("/click")
          .send({
              count:1

            });

    expect(response.status).toBe(200);
        
    });

    test("Click en-dessous de 1", async () => {

      const response = await request(app)
          .post("/click")
          .send({
              count: 0
          });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Le nombre de clics doit être compris entre 1 et 30.")
    });

    test("Click en-dessus de 30", async () => {

      const response = await request(app)
          .post("/click")
          .send({
              count: 31
          });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Le nombre de clics doit être compris entre 1 et 30.")
    });

});

