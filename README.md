# cwserver

`cwserver` is a lightweight and high-performance Node.js web server framework designed for building RESTful APIs and microservices. It provides a simple interface for routing, middleware management, and request handling. It is optimized for speed and minimal overhead, making it perfect for use cases where performance is critical.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
  - [Creating a Simple Server](#creating-a-simple-server)
  - [Handling Different HTTP Methods](#handling-different-http-methods)
- [Advanced Usage](#advanced-usage)
  - [Using Middleware](#using-middleware)
  - [CORS Configuration](#cors-configuration)
  - [Handling POST Requests](#handling-post-requests)
- [API Reference](#api-reference)
  - [cwserver.App()](#cwserverapp)
  - [Methods](#methods)
- [Performance](#performance)
- [Use Cases](#use-cases)
- [License](#license)

---

## Installation

To install `cwserver` in your Node.js project, you can use npm or yarn.

```bash
npm install cwserver
```

or

```bash
yarn add cwserver
```

---

## Basic Usage

### Creating a Simple Server

Once you've installed `cwserver`, you can create a basic web server with minimal code:

```javascript
const cwserver = require('cwserver');

const app = new cwserver.App();

// Simple route
app.get('/hello', (req, res) => {
    res.json({ message: "Hello from cwserver!" });
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

In this example:
- We create an instance of `cwserver.App()`.
- Define a route `GET /hello` that returns a JSON response.
- The server listens on port 3000.

### Handling Different HTTP Methods

`cwserver` allows you to handle various HTTP methods like `GET`, `POST`, `PUT`, and `DELETE`:

```javascript
app.get('/hello', (req, res) => {
    res.json({ message: "Hello, GET!" });
});

app.post('/submit', (req, res) => {
    res.json({ message: "POST request received!" });
});

app.put('/update', (req, res) => {
    res.json({ message: "PUT request received!" });
});

app.delete('/delete', (req, res) => {
    res.json({ message: "DELETE request received!" });
});
```

---

## Advanced Usage

### Using Middleware

You can use `app.prerequisites()` to add global middleware. This middleware will be executed before handling any routes:

```javascript
app.prerequisites((req, res, next) => {
    console.log(`Request method: ${req.method}, Request URL: ${req.url}`);
    next(); // Proceed to the next middleware or route handler
});
```

You can also add middleware for specific routes, enabling fine-grained control.

### CORS Configuration

`cwserver` supports Cross-Origin Resource Sharing (CORS). You can use the `cors` package for custom CORS configuration:

```javascript
const cors = require('cors');

const allowedOrigins = ['https://example.com'];

app.prerequisites(cors({
    origin: allowedOrigins,
    methods: 'GET,POST',
    maxAge: 7200, // 2 hours
    credentials: true,
    allowedHeaders: 'x-app-token, x-app-type, Content-Type, Accept, X-Requested-With, remember-me'
}));
```

In this example:
- CORS is configured to allow requests from `https://example.com`.
- The server supports `GET` and `POST` methods.
- Preflight requests are cached for 2 hours (`maxAge: 7200`).

### Handling POST Requests

You can handle `POST` requests by using `app.post()`:

```javascript
app.post('/data', (req, res) => {
    const requestData = req.body;
    res.json({ received: requestData });
});
```

This route listens for `POST` requests to `/data` and responds with the data sent in the request.

---

## API Reference

### `cwserver.App()`

This creates a new instance of the `cwserver` application.

#### **Methods:**

- **`app.get(route, handler)`**  
  Defines a `GET` route handler for the specified `route`.
  
- **`app.post(route, handler)`**  
  Defines a `POST` route handler for the specified `route`.
  
- **`app.put(route, handler)`**  
  Defines a `PUT` route handler for the specified `route`.
  
- **`app.delete(route, handler)`**  
  Defines a `DELETE` route handler for the specified `route`.
  
- **`app.listen(port, callback)`**  
  Starts the server on the specified `port` and invokes the callback when the server starts.

- **`app.prerequisites(middleware)`**  
  Adds global middleware that is executed before handling any routes.

---

## Performance

`cwserver` is designed to be minimalistic and fast, which makes it ideal for small services, microservices, and APIs where performance is critical. Because `cwserver` is built with minimal dependencies, it has lower overhead compared to larger frameworks like Express.js.

While we don't have official benchmarks, you can expect **cwserver** to perform well under light to moderate load. For high-traffic applications, it's recommended to perform stress testing to ensure it meets your performance needs.

---

## Use Cases

- **Microservices**: Perfect for creating small, lightweight services that need to handle a high number of HTTP requests.
- **RESTful APIs**: Quickly set up and deploy APIs for handling `GET`, `POST`, `PUT`, and `DELETE` requests.
- **Static File Servers**: Serve static files or integrate with frontend frameworks like React or Angular.
- **Lightweight Web Apps**: Build smaller, faster web applications without unnecessary overhead.

---

## License

`cwserver` is licensed under the MIT License.

---

Feel free to ask if you need more information or examples! 🚀
