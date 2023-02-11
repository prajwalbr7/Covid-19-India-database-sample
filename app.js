const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const serverConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
  }
};
serverConnection();

const nameCaseChanger1 = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const nameCaseChanger2 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
///GET
app.get("/states/", async (request, response) => {
  const GettingQuery = `SELECT * FROM state;`;
  const getResult = await db.all(GettingQuery);
  response.send(getResult.map((item) => nameCaseChanger1(item)));
});
///GET BY ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const gettingQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const getResult = await db.get(gettingQuery);
  response.send(nameCaseChanger1(getResult));
});
///POST
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const InsertQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)VALUES
  (
  '${districtName}',
  ${stateId},
  ${cases},
  ${cured},
  ${active},
  ${deaths}
    );`;
  const InsertResult = await db.run(InsertQuery);
  const AutoKey = InsertResult.lastID;
  response.send(`District Successfully Added`);
});
///GETTING DISTRICTS BY ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const gettingQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const getResult = await db.get(gettingQuery);
  response.send(nameCaseChanger2(getResult));
});
///DELETE
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district WHERE district_id=${districtId};`;
  const deleteResult = await db.run(deleteQuery);
  response.send("District Removed");
});
///PUT
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const UpdateQuery = `UPDATE district SET district_name='${districtName}',
    state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths};`;
  const UpdatedRes = await db.run(UpdateQuery);
  const UpdateKey = UpdatedRes.lastID;
  response.send(`District Details Updated`);
});
///GET
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `SELECT SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,SUM(active) AS totalActive,
    COUNT(deaths) AS totalDeaths FROM district WHERE state_id=${stateId};`;
  const getRes = await db.get(getQuery);
  response.send(getRes);
});
///GET 2Query
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const GetQueryDistrict = `SELECT state_id  FROM district WHERE district_id=${districtId};`;
  const GetDistrictResult = await db.get(GetQueryDistrict);

  const GetQueryState = `SELECT state_name AS stateName FROM state WHERE state_id=${GetDistrictResult.state_id};`;
  const GetSateResult = await db.get(GetQueryState);
  response.send(GetSateResult);
});
module.exports = app;
