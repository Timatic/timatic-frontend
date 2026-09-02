# Timatic Frontend

## Build Setup

```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ nuxt
```

open http://localhost:3000/

```
herd proxy app.timatic http://localhost:3000 --secure
```

# Test a production build and launch server
```
$ npm run build --fail-on-error
$ docker-compose build
$ docker-compose up
```

open http://localhost:8080/

## License

Copyright (c) 2025 Timatic.

You may use this software internally within your organization for any purpose. Selling, sublicensing, or providing the software to third parties for commercial gain is prohibited. See [LICENSE.txt](./LICENSE.txt) for full terms.
