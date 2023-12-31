const express = require('express')
const expressLayouts = require('express-ejs-layouts');
const axios = require('axios')
const Promise = require('promise');
const app = express();
const loginRoute = require('./routes/login')
const signUpRoute = require('./routes/signup')
const AccountSettingsRoute = require('./routes/updateAccount')
const categoryRoute = require('./routes/category')
const {router , productsDataArrayToObject} = require('./routes/product')
const cartRouter = require('./routes/cart')
const searchRouter = require('./routes/search')
const bodyParser = require('body-parser')
const session = require('express-session');

const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const adapter = new FileAsync('db.json')

app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');

app.use(expressLayouts);
app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}))


app.get('/' , (req, res) => {
    
    Promise.all([
     axios.get('https://dummyjson.com/products?limit=0'),
     axios.get('https://dummyjson.com/products/categories')])

        .then(function(result){    
            
            const productsResult = result[0].data;
            const categoriesResult = result[1].data

            app.set('categories', categoriesResult)
            app.set('products', productsResult)
            
            const featured = []

            for (const product of productsResult.products) {
            
                if(product.rating > 4.8){
                    featured.push(product)
                }
            }
            
            const userEmail = req.session.userEmail
            app.set('userEmail', userEmail)
            const fetureProducts =  productsDataArrayToObject(featured);
            
            
            const cartCount = cartRouter.getCartCount(req.app, req.session.user)

            res.render('index', {products: fetureProducts, categories : categoriesResult , userEmail: userEmail, cartItems: cartCount});
        })
 
});
    
app.get('/shipping', (req, res) => {
    
    if(!req.session.user){
        res.redirect('/login')
        return
    }

    categoriesResult = app.get('categories')
    userEmail = app.get('userEmail')
    req.session.cart = req.query

    res.render('shippinginfo', {categories : categoriesResult , userEmail: userEmail});
});

app.get('/about', (req, res)=>{
    res.send("About")
})

app.use('/products', router)
app.use('/category', categoryRoute.router)
app.use('/search', searchRouter.router)
app.use('/login', loginRoute.router )
app.use('/signup', signUpRoute.router)
app.use('/cart', cartRouter.router)
app.use('/cart', cartRouter.router)
app.use('/Account_Settings', AccountSettingsRoute.router)

app.post('/logout', (req, res) => {
    req.session.destroy(function(err) {
        res.redirect('/')
    })
})



low(adapter).then(function (db) {
    db.defaults({users : [], carts : []}).write()
    app.set('DB', db)
}).then(function (){
    app.listen(3000, () => {
        console.log(`Example app listening on port http://127.0.0.1:3000/`)
    })
    
})


