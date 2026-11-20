import { Link } from 'react-router-dom'

export default function TournamentRequestStatus({ loading, error, retry, subject = 'tournament', notFoundTitle = 'Tournament not found' }) {
  const notFound = error?.status === 404
  return (
    <section className="content-panel">
      {loading ? <p role="status">{`Loading ${subject}…`}</p> : <>
        <h2>{notFound ? notFoundTitle : `Unable to load ${subject}`}</h2>
        {!notFound && <p className="form-message" role="alert">{error.message}</p>}
        <div className="page-actions">
          {!notFound && retry && <button className="button button-secondary" type="button" onClick={retry}>Try again</button>}
          <Link className="button button-secondary" to="/tournaments">Back to tournaments</Link>
        </div>
      </>}
    </section>
  )
}
