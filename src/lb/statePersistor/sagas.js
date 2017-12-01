// @flow
import {app} from 'electron'
import path from 'path'
import {call, put, fork, select, takeLatest} from 'redux-saga/effects'
import {delay} from 'redux-saga'
import fse from 'fs-extra'
import deepEqual from 'deep-equal'
import {bootstrapAction, mergeStateAction} from '$lb/common/actions'
import pickPathsFromObject from 'lodash/pick'

const pathToPersistenceFile = path.join(app.getPath('userData'), 'state.json')

const whitelistOfPartsOfStateToPersist = [['projects']]

export default function* statePersistorRootSaga(): Generator<*, *, *> {
  yield call(loadState)
  yield fork(persistStateChanges)
  yield null
}

function* loadState(): Generator<*, *, *> {
  // return yield put(bootstrapAction())

  const fileExists: boolean = yield call(fse.pathExists, pathToPersistenceFile)
  if (!fileExists) return yield put(bootstrapAction())

  const content = yield call(fse.readFile, pathToPersistenceFile, {
    encoding: 'utf-8',
  })

  let jsonData
  try {
    jsonData = JSON.parse(content)
  } catch (e) {
    console.error(`could not parse json content in state file '${pathToPersistenceFile}'`)
    return yield put(bootstrapAction())
    // @todo report this
  }

  yield put(mergeStateAction(jsonData))
  return yield put(bootstrapAction())
}

function* persistStateChanges(): Generator<*, *, *> {
  let lastState = pickPathsFromObject(yield select(), whitelistOfPartsOfStateToPersist)
  yield takeLatest('*', function*(): Generator<*, *, *> {
    yield delay(2)
    const newState = pickPathsFromObject(yield select(), whitelistOfPartsOfStateToPersist)
    if (!deepEqual(lastState, newState)) {
      yield call(persistNewState, newState)
      lastState = newState
    }
  })
}

function* persistNewState(newState: {}): Generator<*, *, *> {
  yield call(fse.ensureFile, pathToPersistenceFile)
  const stringified = JSON.stringify(newState)
  yield call(fse.writeFile, pathToPersistenceFile, stringified, {
    encoding: 'utf-8',
  })
}
