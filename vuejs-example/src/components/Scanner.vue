<template>
  <QrcodeStream class="scanner" @decode="onScan" @init="onInit"/>

  <h2>Results</h2>
  <table>
    <thead>
    <tr>
      <td>
        Signer
      </td>
      <td>
        Country
      </td>
      <td>
        Person
      </td>
      <td>
        Birthday
      </td>
      <td>
        Date of vacc
      </td>
      <td>
        Product
      </td>
      <td>
        Dose
      </td>
    </tr>
    </thead>
    <tbody>
    <tr v-for="(result, idx) in results" :key="idx">
      <td>
        {{ result.issuer }}
      </td>
      <td>
        {{ result.country }}
      </td>
      <td>
        {{ result.person.Forename }} {{ result.person.Surname }}
      </td>
      <td>
        {{ result.person.Birthday }}
      </td>
      <td>
        {{ result.certificates[0].DateOfVaccination }}
      </td>
      <td>
        {{ result.certificates[0].VaccineMedicinalProduct }}
      </td>
      <td>
        {{ result.certificates[0].DoseNumber }} of {{ result.certificates[0].TotalSeriesOfDoses }}
      </td>
    </tr>
    </tbody>
  </table>
</template>

<script>
import { ref } from 'vue'
import { QrcodeStream } from 'vue3-qrcode-reader'

import { readCertificate, readQrCode } from '../libs/ehealth/functions'

export default {
  components: {
    QrcodeStream,
  },

  setup () {
    const error = ref(null)
    const results = ref([])

    async function onInit (promise) {
      try {
        await promise
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          this.error = 'ERROR: you need to grant camera access permisson'
        } else if (error.name === 'NotFoundError') {
          this.error = 'ERROR: no camera on this device'
        } else if (error.name === 'NotSupportedError') {
          this.error = 'ERROR: secure context required (HTTPS, localhost)'
        } else if (error.name === 'NotReadableError') {
          this.error = 'ERROR: is the camera already in use?'
        } else if (error.name === 'OverconstrainedError') {
          this.error = 'ERROR: installed cameras are not suitable'
        } else if (error.name === 'StreamApiNotSupportedError') {
          this.error = 'ERROR: Stream API is not supported in this browser'
        }
      }
    }

    async function onScan (result) {
      if (result.substring(0, 4) !== 'HC1:') {
        console.warn('Could not find the HC1 identifier in the scanned string', result)
        return
      }

      const decoded = await readQrCode(result)
      const certificate = readCertificate(decoded.content)

      results.value.unshift({
        issuer: decoded.issuer,
        country: decoded.country,
        ...certificate,
      })
    }

    return {
      onInit,
      onScan,
      error,
      results,
    }
  },
}
</script>

<style>
.scanner {
  max-width: 500px !important;
  margin-left: auto;
  margin-right: auto;
}

table {
  border: 1px solid black;
}

td {
  border: 1px solid black;
}

</style>
