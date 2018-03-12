import * as fse from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import {call} from 'redux-saga/effects'

type ReturnType =
  | {type: 'ok'; isIt: false}
  | {type: 'ok'; isIt: true; filePath: string}
  | {type: 'error'; message: string}

export default function* isPathAProject(params: {
  fileOrFolderPath: string
}): Generator_<$FixMe, ReturnType, $FixMe> {
  if ((yield call(fse.pathExists, params.fileOrFolderPath)) !== true) {
    return {type: 'ok', isIt: false}
  }

  if (_.endsWith(params.fileOrFolderPath, '/theater.json')) {
    return {type: 'ok', isIt: true, filePath: params.fileOrFolderPath}
  }

  let pathStat
  try {
    pathStat = yield call(fse.stat, params.fileOrFolderPath)
  } catch (e) {
    console.error(e)
    return {type: 'error', message: `Path couldn't be read`}
  }

  if (pathStat.isDirectory()) {
    const pathToFile = path.join(params.fileOrFolderPath, 'theater.json')
    if ((yield call(fse.pathExists, pathToFile)) === true)
      return {type: 'ok', isIt: true, filePath: pathToFile}
  }

  return {type: 'ok', isIt: false}
}
