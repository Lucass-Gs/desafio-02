/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExist } from '../middlewares/check-session-id-exist'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExist],
    },
    async (req) => {
      const { sessionId } = req.cookies
      const meals = await knex('meals').where('session_id', sessionId).select()
      return {
        meals,
      }
    },
  )
  app.post(
    '/',
    {
      preHandler: [checkSessionIdExist],
    },
    async (req, res) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        inDiet: z.boolean(),
      })

      const { sessionId } = req.cookies

      const { name, description, inDiet } = createMealBodySchema.parse(req.body)

      const userSchema = z.object({
        id: z.string(),
      })

      const user = await knex('users')
        .select('id')
        .where({
          session_id: sessionId,
        })
        .first()

      const { id } = userSchema.parse(user)

      if (!id) {
        return res.status(404).send('User not found')
      }

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        inDiet,
        user_id: id,
        session_id: sessionId,
      })

      return res.status(201).send()
    },
  )
  app.patch(
    '/:id',
    {
      preHandler: [checkSessionIdExist],
    },
    async (req, res) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        inDiet: z.boolean(),
      })
      const { id } = getMealsParamsSchema.parse(req.params)
      const { sessionId } = req.cookies
      const { name, description, inDiet } = updateMealBodySchema.parse(req.body)

      await knex('meals')
        .update({
          name,
          description,
          inDiet,
        })
        .where({
          session_id: sessionId,
          id,
        })

      return res.status(204).send()
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExist],
    },
    async (req, res) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(req.params)
      const { sessionId } = req.cookies

      await knex('meals').delete().where({
        session_id: sessionId,
        id,
      })

      return res.status(204).send()
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExist],
    },
    async (req) => {
      const getMealsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamsSchema.parse(req.params)
      const { sessionId } = req.cookies

      const meal = await knex('meals')
        .where({
          session_id: sessionId,
          id,
        })
        .select()

      return {
        meal,
      }
    },
  )

  app.get(
    '/user/:userId',
    {
      preHandler: [checkSessionIdExist],
    },
    async (req) => {
      const getMealsParamsSchema = z.object({
        userId: z.string().uuid(),
      })

      const { userId } = getMealsParamsSchema.parse(req.params)
      const { sessionId } = req.cookies

      const meals = await knex('meals')
        .where({
          session_id: sessionId,
          user_id: userId,
        })
        .select()

      return {
        meals,
      }
    },
  )
}
