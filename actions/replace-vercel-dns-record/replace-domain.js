const fetch = require('node-fetch')

function checkStatusAndParseResponse(res) {
  if (res.status < 200 || res.status >= 300) {
    return res.json()
      .then(
        ({ error: { code, message } }) => {
          throw new Error(`Response error code ${code}: ${message}`)
        },
      )
      .catch(error => {
        throw new Error(`Response status received without JSON error body: ${res.status}; ${error.message}`)
      })
  }

  if (res.status === 204) return ''

  return res.text()
    .then(text => {
      try {
        return JSON.parse(text)
      } catch (error) {
        console.warn(`Invalid json response: ${error.message}`)
        return ''
      }
    })
}

function authorizedFetchAndParse(urlPath, token, options) {
  return fetch(`https://api.vercel.com${urlPath}`, {
    ...options,
    headers: {
      ...(options && options.headers),
      Authorization: `Bearer ${token}`,
    },
  }).then(checkStatusAndParseResponse)
}

function getTeamId({ teamName, token }) {
  return authorizedFetchAndParse('/v1/teams', token)
    .then(({ teams }) => teams.filter(({ name, slug }) => slug.toLowerCase() === teamName || name.toLowerCase() === teamName))
    .then(teams => {
      if (teams.length === 1) return teams[ 0 ]
      if (teams.length > 1) {
        throw new Error('team name matched more than 1 team')
      } else {
        throw new Error('team name did not match any team')
      }
    })
    .then(team => team.id)
}

function getExistingRecords({ domain, subdomain, recordType, teamId, token }) {
  // GET /v4/domains/:domain/records
  return authorizedFetchAndParse(`/v4/domains/${domain}/records?limit=10000&teamId=${teamId}`, token)
    .then(
      ({ records }) => records.filter(({ type, name }) => type.toLowerCase() === recordType.toLowerCase() && name.toLowerCase() === subdomain.toLowerCase()),
    )
    .then(records => records.map(record => record.id))
}

function createRecord({ domain, subdomain, recordType, value, teamId, token }) {
  return authorizedFetchAndParse(`/v2/domains/${domain}/records?teamId=${teamId}`, token, {
    method: 'POST',
    body: JSON.stringify({
      name: subdomain,
      type: recordType,
      value,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(({ uid }) => uid)
}

function deleteRecord({ domain, recordId, teamId, token }) {
  return authorizedFetchAndParse(`/v2/domains/${domain}/records/${recordId}?teamId=${teamId}`, token, {
    method: 'DELETE',
  })
}

module.exports = async function replaceDomain({ domain, subdomain, recordType, token, teamName, value }) {
  const teamId = await getTeamId({ teamName, token })

  const recordsToDelete = await getExistingRecords({ domain, subdomain, recordType, teamId, token })

  const createdUid = await createRecord({ domain, subdomain, recordType, teamId, token, value })

  if (recordsToDelete.indexOf(createdUid) !== -1) {
    console.log('Record already exists, create was idempotent')
  } else {
    console.log(`Created record with uid ${createdUid}, deleting others`)
  }


  const filteredToDelete = recordsToDelete.filter(recordId => recordId !== createdUid)

  if (filteredToDelete.length > 0) {
    console.log(`Deleting records: ${filteredToDelete.join(', ')}`)
    await Promise.all(
      filteredToDelete.map(recordId => deleteRecord({ domain, recordId, token, teamId })),
    )
    console.log('Deleted records. Updated completed.')
  } else {
    console.log('No records to delete. Update completed.')
  }
}