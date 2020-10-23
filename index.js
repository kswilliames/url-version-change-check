const core = require("@actions/core")
const proc = require("child_process")
const duration = require("duration-js")

const processConfig = {
    stdio: "inherit",
    encoding: "utf8",
}

const curl = async (url, property) => {
    const command = `curl --fail -s '${url}' | jq '${property}'`
    core.debug(`Running command: ${command}`)
    return proc.execSync(command, processConfig)
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
        if (result === version) return
        count++
        await wait(retryDelay)
    }

    core.setFailed(`Server version did not change in time`)
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