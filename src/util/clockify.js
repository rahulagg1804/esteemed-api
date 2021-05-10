import axios from 'axios'
import { promises as fs } from 'fs'

const config = {
  headers: {
    'X-Api-Key': process.env.CLOCKIFY_TOKEN
  }
}

const clockifyLastRunPath = '/tmp/clockify-lastrun'

// Set billing interval.
const date = new Date()
const dateEnd = date.toISOString()

const dateStart = await fs.readFile(clockifyLastRun, 'utf-8')
  .then(ts => new Date(ts).toISOString())
  .catch(() => false)

export async function getHours(filter) {
  const request = {
    "dateRangeStart": dateStart,
    "dateRangeEnd": dateEnd,
    "detailedFilter": {
      "page": 1,
      "pageSize": 200,
      "sortColumn": "DATE",
    },
    "sortOrder": "DESCENDING",
    "exportType": "JSON",
    "amountShown": "EARNED",
    "timeZone": "America/New_York",
    "billable": true,
  }

  // Get hour report for the last 2 weeks.
  return axios.post(`https://reports.api.clockify.me/v1/workspaces/${process.env.CLOCKIFY_WORKSPACE}/reports/detailed`, request, config)
    .then(({ data }) => {
      // Store current timestamp.
      fs.writeFile(clockifyLastRunPath, Math.floor(Date.now() / 1000))

      return data.timeentries.reduce(
        (objectsByKeyValue, obj) => ({
          ...objectsByKeyValue,
          [obj[filter]]: (objectsByKeyValue[obj[filter]] || []).concat(obj)
        }), {})
    })
    .catch(e => console.error(e))
}

export function reduceEmails(hours) {
  return Object.keys(hours).flatMap(group => hours[group].flatMap(entry => entry.userEmail))
}