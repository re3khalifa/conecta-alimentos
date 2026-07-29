const router = require("express").Router();
const path = require("path");

const soapController = require("../controllers/soap.controller");

router.get("/", soapController.getOffersSOAP);

router.get("/wsdl", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "wsdl", "ofertas.wsdl")
  );
});

module.exports = router;
