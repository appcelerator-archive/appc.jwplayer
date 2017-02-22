#!groovy
@Library('pipeline-library') _

timestamps {
	node('git && (osx || linux)') {
		stage('Checkout') {
			checkout scm
		}

		stage('Configuration') {
			sh "echo \"connectors: { 'appc.jwplayer': { endpoint: 'https://api.jwplatform.com/', api_key: 'IsPDSzIr', api_secret: 'uIyn8lYzGKBSkDbk6mqRdUAq', version: 'v1' } };\" > conf/local.js"
		}

		buildConnector {
			// don't override anything yet
		}
	}
}
