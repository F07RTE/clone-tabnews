function status(request, response) {
  response.status(200).json({ status: "This course is amazing" });
}

export default status;
