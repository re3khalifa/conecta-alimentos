const router = require('express').Router();
const offerController = require('../controllers/offer.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const { uploadOfferImage } = require('../middlewares/upload.middleware');
const { offerValidation } = require('../validators/offer.validators');
const validate = require('../middlewares/validate.middleware');

// Públicas
router.get('/',     offerController.getAll);

// ⚠️ /mine debe ir antes de /:id
router.get('/mine', requireAuth, requireRole('commerce', 'admin'), offerController.getMine);
router.get('/:id',  offerController.getById);

// Protegidas — uploadOfferImage debe ir ANTES de offerValidation, ya que es
// multipart/form-data: multer parsea el body antes de que express-validator
// pueda leer req.body.
router.post('/',      requireAuth, requireRole('commerce', 'admin'), uploadOfferImage.single('image'), offerValidation, validate, offerController.create);
router.put('/:id',    requireAuth, requireRole('commerce', 'admin'), uploadOfferImage.single('image'), offerValidation, validate, offerController.update);
router.delete('/:id', requireAuth, requireRole('commerce', 'admin'), offerController.remove);

module.exports = router;
