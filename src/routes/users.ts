/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExist } from '../middlewares/check-session-id-exist'

export async function userRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExist],
    },
    async (req) => {
      const { sessionId } = req.cookies
      const users = await knex('users').where('session_id', sessionId).select()
      return {
        users,
      }
    },
  )
  app.post('/', async (req, res) => {
    const createUserBodySchema = z.object({
      first_name: z.string(),
      last_name: z.string(),
    })

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    const { first_name, last_name } = createUserBodySchema.parse(req.body)

    await knex('users').insert({
      id: randomUUID(),
      first_name,
      last_name,
      session_id: sessionId,
    })

    return res.status(201).send()
  })

  app.get(
    '/summary/:userId',
    {
      preHandler: [checkSessionIdExist],
    },
    async (req) => {
      const getMealsParamsSchema = z.object({
        userId: z.string().uuid(),
      })
      const { sessionId } = req.cookies
      const { userId } = getMealsParamsSchema.parse(req.params)

      const meals = await knex('meals')
        .where({
          session_id: sessionId,
          user_id: userId,
        })
        .select()

      let currentStreak = 0
      let bestStreak = 0

      meals.forEach((meal) => {
        if (meal.inDiet) {
          currentStreak += 1
          if (currentStreak > bestStreak) {
            bestStreak = currentStreak
          }
        } else {
          currentStreak = 0
        }
      })

      const totalMeals = await knex('meals')
        .where({
          session_id: sessionId,
          user_id: userId,
        })
        .count('id as total')
        .first()

      const totalMealsInDiet = await knex('meals')
        .where({
          session_id: sessionId,
          user_id: userId,
          inDiet: true,
        })
        .count('id as total')
        .first()

      const totalMealsOutDiet = await knex('meals')
        .where({
          session_id: sessionId,
          user_id: userId,
          inDiet: false,
        })
        .count('id as total')
        .first()

      const summary = {
        totalMeals: totalMeals || 0,
        totalMealsInDiet: totalMealsInDiet || 0,
        totalMealsOutDiet: totalMealsOutDiet || 0,
        bestStreak,
      }

      return {
        summary,
      }
    },
  )
}
