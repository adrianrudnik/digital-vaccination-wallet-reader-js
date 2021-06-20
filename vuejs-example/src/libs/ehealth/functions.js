import cose from 'cose-js'
import { createHash } from 'sha256-uint8array'
import { inflate } from 'pako'
import { decode } from 'cbor'
import base45 from 'base45-js'
import { Buffer } from 'buffer'

import certs from './certificates'

function getCertificateVerifiers (certs) {
  return certs.map(v => {
    const fingerprint = createHash().update(v.raw).digest()
    const id = fingerprint.slice(0, 8)

    const pk = v.publicKey.keyRaw
    const keyX = Buffer.from(pk.slice(1, 1 + 32))
    const keyY = Buffer.from(pk.slice(33, 33 + 32))

    return {
      key: {
        'x': keyX,
        'y': keyY,
        'kid': id,
      },
      about: {
        issuer: v.issuer.organizationName,
        country: v.issuer.countryName,
      },
    }
  })
}

function decodePayload (payload) {
  // Remove prefix, you could use it to identify that this is an pass though
  if (payload.startsWith('HC1')) {
    payload = payload.substring(3)
    if (payload.startsWith(':')) {
      payload = payload.substring(1)
    }
  }

  payload = base45.decode(payload)

  // Payload might be packed, not sure why, its already small and somewhat binary
  if (payload[0] === 0x78) {
    payload = inflate(payload)
  }

  return payload
}

export async function readQrCode (payload) {
  const data = decodePayload(payload)

  // Is there no root certificate? I'm getting to old for this, so I just
  // start a verify with every known verifier in parallel and wait for the
  // outcome to extract the winner.
  const verifyResult = await Promise.all(verifiers.map(async (verifier) => {
    try {
      const buf = await cose.sign.verify(data, verifier)
      return {
        content: decode(buf),
        issuer: verifier.about.issuer,
        country: verifier.about.country,
      }
    } catch (e) {
      return null
    }
  }))

  const cert = verifyResult.find(v => v !== null)

  if (cert === undefined) {
    return Promise.reject(new Error('Invalid payload'))
  }

  return cert
}

export function readCertificate (payload) {
  // Definition for personal information can be found in
  // https://github.com/ehn-dcc-development/ehn-dcc-schema/blob/release/1.3.0/DCC.Core.Types.schema.json

  // Definitions about related types can be found in
  // https://github.com/ehn-dcc-development/ehn-dcc-schema/blob/release/1.3.0/DCC.Types.schema.json

  const sensitive = payload.get(-260).get(1)

  let out = {
    certificates: [],
  }

  // parse sensitive infos about the person
  out.person = {
    Birthday: sensitive.dob,
    Surname: sensitive.nam.fn,
    SurnameStandardised: sensitive.nam.fnt,
    Forename: sensitive.nam.gn,
    ForenameStandardised: sensitive.nam.gnt,
  }

  // parse certificate infos, not sure why this is an array
  // when every certificate ends up as a single full qr code ?!
  payload.get(-260).get(1).v.forEach(function (cert) {
    out.certificates.push({
      CertificateIdentifier: cert.ci,
      CountryOfVaccination: cert.co,
      DoseNumber: cert.dn,
      DateOfVaccination: cert.dt,
      CertificateIssuer: cert.is,
      MarketingAuthorizationHolder: cert.ma,
      VaccineMedicinalProduct: cert.mp,
      TotalSeriesOfDoses: cert.sd,
    })
  })

  return out
}

const verifiers = getCertificateVerifiers(certs)
