require('dotenv').config()
import 'reflect-metadata'
import express from 'express'
import { createConnection } from 'typeorm'
import { User } from './entities/User'
// import { Post } from './entities/Post'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { HelloResolver } from './resolvers/hello'
// import { UserResolver } from './resolvers/user'
import { __prod__ } from './constants'
// import { Context } from './types/Context'
// import { PostResolver } from './resolvers/post'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
// import cors from 'cors'
import { createServer } from 'http'
// import { Upvote } from './entities/Upvote'
// import { buildDataLoaders } from './utils/dataLoaders'
// import path from 'path'

const main = async () => {
  await createConnection({
    type: 'postgres',
    ...(__prod__
      ? { url: process.env.DATABASE_URL }
      : {
          database: 'lotus',
          username: process.env.DB_USERNAME_DEV,
          password: process.env.DB_PASSWORD_DEV
        }),
    logging: true,
    ...(__prod__
      ? {
          extra: {
            ssl: {
              rejectUnauthorized: false
            }
          },
          ssl: true
        }
      : {}),
    ...(__prod__ ? {} : { synchronize: true }),
    entities: [User]
    // migrations: [path.join(__dirname, '/migrations/*')]
  })

  // if (__prod__) await connection.runMigrations()

  const app = express()

  const httpServer = createServer(app)

  // app.use(
  // 	cors({
  // 		origin: __prod__
  // 			? process.env.CORS_ORIGIN_PROD
  // 			: process.env.CORS_ORIGIN_DEV,
  // 		credentials: true
  // 	})
  // )

  // app.set('trust proxy', 1)

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver],
      validate: false
    }),
    // context: ({ req, res }): Context => ({
    // 	req,
    // 	res,
    // 	connection,
    // 	dataLoaders: buildDataLoaders()
    // }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
  })

  await apolloServer.start()

  apolloServer.applyMiddleware({ app }) // remove cors: false for it to work in apollo studio

  const PORT = process.env.PORT || 4000

  await new Promise(resolve =>
    httpServer.listen({ port: PORT }, resolve as () => void)
  )

  console.log(
    `Server started on port ${PORT}. GraphQL endpoint on http://localhost:${PORT}/graphql or http://localhost:${PORT}${apolloServer.graphqlPath}`
  )

  // This is fine as well
  // httpServer.listen(PORT, () =>
  //   console.log(
  //     `Server started on port ${PORT}. GraphQL endpoint on http://localhost:${PORT}/graphql or http://localhost:${PORT}${apolloServer.graphqlPath}`
  //   )
  // )

  // OLD WAY
  // app.listen(PORT, () =>
  //   console.log(
  //     `Server started on port ${PORT}. GraphQL server started on localhost:${PORT}${apolloServer.graphqlPath}`
  //   )
  // );
}

main().catch(error => console.log(error))
