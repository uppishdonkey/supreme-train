const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');


// get all products
router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [
        {
          model: Product, model: Tag
        },
      ],
    });
    res.status(200).json(productData)
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category, model: Tag }],
    });

    if (!productData) {
      res.status(404).json({ message: "No product found with that ID" });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});
// find a single product by its `id`
// be sure to include its associated Category and Tag data

// create new product
router.post('/', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => ({
        product_id: newProduct.id,
        tag_id,
      }));
      await ProductTag.bulkCreate(productTagIdArr);
    }
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {

        ProductTag.findAll({
          where: { product_id: req.params.id }
        }).then((productTags) => {
          // create filtered list of new tag_ids
          const productTagIds = productTags.map(({ tag_id }) => tag_id);
          const newProductTags = req.body.tagIds
            .filter((tag_id) => !productTagIds.includes(tag_id))
            .map((tag_id) => {
              return {
                product_id: req.params.id,
                tag_id,
              };
            });

          // figure out which ones to remove
          const productTagsToRemove = productTags
            .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
            .map(({ id }) => id);
          // run both actions
          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsToRemove } }),
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }

      return res.json(product);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const deletedProductData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!deletedProductData) {
      res.status(404).json({ message: 'No product found with this ID' });
      return;
    }

    res.status(200).json(deletedProductData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;