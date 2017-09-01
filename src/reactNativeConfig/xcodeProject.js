import xcode from 'xcode'
import _ from 'lodash'
import fs from 'fs'

const xcodeProjectFromFile = projectPath => xcode.project(projectPath).parseSync()

const saveXcodeProject = (projectPath, xcodeProject) => fs.writeFileSync(projectPath, xcodeProject.writeSync())

const getBuildConfigurations = projectPath => {
  const xcodeProject = xcodeProjectFromFile(projectPath)
  return _.chain(xcodeProject.pbxXCBuildConfigurationSection())
    .map(buildConfiguration => buildConfiguration.name)
    .uniq()
    .compact()
    .value()
}

export const addUserDefinedEnvironment = projectPath => {
  console.log(`\nAdding user defined ENVIRONMENT variables in ${projectPath}\n`)

  const xcodeProject = xcodeProjectFromFile(projectPath)
  const buildConfigurations = getBuildConfigurations(projectPath)
  _.forEach(buildConfigurations, buildConfiguration => {
    const projectBuildConfig = _.find(xcodeProject.pbxXCBuildConfigurationSection(), x => !_.has(x, 'buildSettings.PRODUCT_NAME') && x.name === buildConfiguration)
    projectBuildConfig.buildSettings.ENVIRONMENT = _.toUpper(buildConfiguration)
  })
  saveXcodeProject(projectPath, xcodeProject)
}

export const copyBuildConfiguration = (projectPath, existingBuildConfigName, newBuildConfigurationName) => {
  console.log(`\nCopying build configuration: ${existingBuildConfigName} to ${newBuildConfigurationName} in ${projectPath}\n`)
  const xcodeProject = xcodeProjectFromFile(projectPath)

  const buildConfigurationsToCopy = _.pickBy(xcodeProject.pbxXCBuildConfigurationSection(), buildConfiguration => buildConfiguration.name === existingBuildConfigName)

  _.forEach(buildConfigurationsToCopy, (buildConfigurationToCopy, key) => {
    const newBuildConfigUuid = xcodeProject.generateUuid()
    xcodeProject.pbxXCBuildConfigurationSection()[newBuildConfigUuid] = _.cloneDeep(buildConfigurationToCopy)
    xcodeProject.pbxXCBuildConfigurationSection()[newBuildConfigUuid].name = newBuildConfigurationName
    xcodeProject.pbxXCBuildConfigurationSection()[`${newBuildConfigUuid}_comment`] = newBuildConfigurationName

    const xcConfigListKey = _.findKey(xcodeProject.pbxXCConfigurationList(), xcConfigList => _.includes(_.map(xcConfigList.buildConfigurations, 'value'), key))

    xcodeProject.pbxXCConfigurationList()[xcConfigListKey].buildConfigurations.push({ value: newBuildConfigUuid, comment: newBuildConfigurationName })
  })

  saveXcodeProject(projectPath, xcodeProject)
}
