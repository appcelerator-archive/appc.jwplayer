# JWplayer connector

This connector wraps the JWPlayer REST api

To point a model to the correct REST endpoint, you need to add the following to your model:

```javascript
	metadata: {
		endpoint: 'channels'
	}
```

In the above example, `findOne` maps to `channels/show`, `findAll` maps to `channels/list`, `query` maps to `findAll` 
with parameters passed to it for pagination, tag filtering, etc.

Note: For the odd endpoints like `channels/videos/list`, you'll need to use the `query` API since you have to pass a 
`channel_key` with the request.