const core = require("@actions/core")
const exec = require("child_process").execSync
const duration = require("duration-js")

const curl = async (url, property) => {
    const command = `curl --fail -s '${url}' | jq -j '${property}'`
    core.debug(`Running command: ${command}`)
    return exec(command).toString()
}

const wait = async (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

const checkUrl = async (url, version, { retryMax, retryDelay, startDelay }, property) => {
    let count = 0
    core.info(`Version check ${url}`)

    await wait(startDelay)

    while (count < retryMax) {
        const result = await curl(url, property)
        core.info(`Checked upgrade to version ${version} with result ${result}`)
        core.info(typeof version)
        core.info(version)
        core.info(typeof result)
        core.info(result)
        const test = result === version;
        core.info(typeof test)
        core.info(test)
        if (test) return
        count++
        await wait(retryDelay)
    }

    throw new Error(`Server version did not change in time`)
}

const versionCheck = async () => {
    try {
        const url = core.getInput("url", { required: true })
        const version = core.getInput("version", { required: true })
        const retryMax = parseInt(core.getInput("retry-max"))
        const retryDelay = duration.parse(core.getInput("retry-delay")).milliseconds()
        const startDelay = duration.parse(core.getInput("start-delay")).milliseconds()
        const property = core.getInput("property")
    
        await checkUrl(url, version, { retryMax, retryDelay, startDelay }, property)
    
        core.info("Success")
    } catch (e) {
        console.error("Error", e)
        core.setFailed(e.message)
    }
}

versionCheck()