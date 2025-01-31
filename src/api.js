import express from "express";
import { graphqlHTTP } from "express-graphql";
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from "graphql";
import fetch from "node-fetch";

const API_KEY = "YFJFmt5JbbwrU4m4X8TvV49mWo6STPB3";

// Define the Giphy GIF type
const GiphyGifType = new GraphQLObjectType({
  name: "GiphyGif",
  fields: {
    id: { type: GraphQLString },
    images: { type: GraphQLString },
  },
});

// Define the root query type
const RootQueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    randomGifs: {
      type: [GiphyGifType],
      resolve: async () => {
        try {
          const response1 = await fetch(
            `https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}`
          );
          const response2 = await fetch(
            `https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}`
          );
          const response3 = await fetch(
            `https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}`
          );

          const [gif1, gif2, gif3] = await Promise.all([
            response1.json(),
            response2.json(),
            response3.json(),
          ]);

          const data = [gif1.data, gif2.data, gif3.data];
          return data;
        } catch (error) {
          console.error("Error fetching random GIFs:", error);
          throw new Error("Failed to fetch random GIFs");
        }
      },
    },
    searchGifs: {
      type: [GiphyGifType],
      args: {
        query: { type: GraphQLString },
      },
      resolve: async (parent, args) => {
        const { query } = args;

        try {
          const response = await fetch(
            `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
              query
            )}&limit=10`
          );
          const data = await response.json();

          if (response.status === 429) {
            throw new Error("API limit exceeded");
          } else {
            const gifData = data.data.map((gif) => ({
              id: gif.id,
              images: gif.images,
            }));
            return gifData;
          }
        } catch (error) {
          console.error("Error searching GIFs:", error);
          throw new Error("Failed to search GIFs");
        }
      },
    },
  },
});

// Create a GraphQL schema
const schema = new GraphQLSchema({
  query: RootQueryType,
});

// Create an Express app
const app = express();

// Define the GraphQL endpoint
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
