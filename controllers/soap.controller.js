const mongoose = require("mongoose");
const Offer = require("../models/Offer");

exports.getOffersSOAP = async (req, res, next) => {
  try {

    let offers = [];

    // Si envían un id
    if (req.query.id) {

      if (!mongoose.Types.ObjectId.isValid(req.query.id)) {
        return res
          .status(400)
          .type("text/xml")
          .send(`<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Fault>
      <Code>400</Code>
      <Message>ID inválido</Message>
    </Fault>
  </soap:Body>
</soap:Envelope>`);
      }

      const offer = await Offer.findById(req.query.id).lean();

      if (!offer) {
        return res
          .status(404)
          .type("text/xml")
          .send(`<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Fault>
      <Code>404</Code>
      <Message>Oferta no encontrada</Message>
    </Fault>
  </soap:Body>
</soap:Envelope>`);
      }

      offers.push(offer);

    } else {

      offers = await Offer.find().lean();

    }

    let offersXML = "";

    offers.forEach((offer) => {

      offersXML += `
      <Offer>
        <Id>${offer._id}</Id>
        <Title>${offer.title}</Title>
        <Description>${offer.description}</Description>
        <Category>${offer.category}</Category>
        <Price>${offer.price}</Price>
        <Quantity>${offer.quantity}</Quantity>
        <ExpirationDate>${offer.expirationDate}</ExpirationDate>
      </Offer>
      `;

    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>

<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">

<soap:Body>

<GetOffersResponse>

${offersXML}

</GetOffersResponse>

</soap:Body>

</soap:Envelope>`;

    res.set("Content-Type", "text/xml");
    res.send(xml);

  } catch (err) {
    next(err);
  }
};