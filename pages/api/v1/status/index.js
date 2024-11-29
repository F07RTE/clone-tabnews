import database from "../../../../infra/database.js";

async function status(request, response) {
  var result = await database.query("SELECT 1 + 1 AS sum");
  console.log(result.rows);
  response.status(200).json({ status: "This course is amazing" });
}

export default status;
