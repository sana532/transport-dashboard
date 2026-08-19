import type { Plugin } from 'vite'

const DOWNLOAD_PATH = /^\/api\/company\/reports\/(\d+)\/download\/?$/
const API_ORIGIN = 'https://syria-travel.app'

/**
 * Report download 302s to Cloudflare R2. Browsers hide that Location (CORS).
 * Node follows the redirect and streams the file back same-origin.
 */
export function reportDownloadProxy(): Plugin {
  return {
    name: 'report-download-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl ?? req.url ?? ''
        const match = DOWNLOAD_PATH.exec(url.split('?')[0] ?? '')
        if (!match || req.method !== 'GET') {
          next()
          return
        }

        const reportId = match[1]
        const auth = req.headers.authorization
        const acceptLanguage = req.headers['accept-language']
        const locale = req.headers['x-locale']

        try {
          const apiRes = await fetch(`${API_ORIGIN}/api/company/reports/${reportId}/download`, {
            method: 'GET',
            headers: {
              Accept: 'application/json, */*',
              ...(typeof auth === 'string' ? { Authorization: auth } : {}),
              ...(typeof acceptLanguage === 'string' ? { 'Accept-Language': acceptLanguage } : {}),
              ...(typeof locale === 'string' ? { 'X-Locale': locale } : {}),
            },
            redirect: 'manual',
          })

          const location = apiRes.headers.get('location')
          if (apiRes.status >= 300 && apiRes.status < 400 && location) {
            const fileRes = await fetch(location, { redirect: 'follow' })
            await pipeFetchToNode(fileRes, res)
            return
          }

          await pipeFetchToNode(apiRes, res)
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              message: error instanceof Error ? error.message : 'Failed to download report',
            }),
          )
        }
      })
    },
  }
}

async function pipeFetchToNode(
  response: Response,
  res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (chunk?: unknown) => void },
) {
  res.statusCode = response.status
  const contentType = response.headers.get('content-type')
  const disposition = response.headers.get('content-disposition')
  if (contentType) res.setHeader('Content-Type', contentType)
  if (disposition) res.setHeader('Content-Disposition', disposition)
  res.setHeader('Cache-Control', 'no-store')
  const buffer = Buffer.from(await response.arrayBuffer())
  res.end(buffer)
}
