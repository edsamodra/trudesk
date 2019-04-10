/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import React from 'react'

import TicketsContainer from 'containers/TicketsContainer'
import SettingsContainer from 'containers/Settings/SettingsContainer'
import AccountsContainer from 'containers/Accounts'
import TeamsContainer from 'containers/Teams'
import DepartmentsContainer from 'containers/Departments'

export default function (store) {
  if (document.getElementById('tickets-container')) {
    const view = document.getElementById('tickets-container').getAttribute('data-view')
    const page = document.getElementById('tickets-container').getAttribute('data-current-page')
    const prevPage = document.getElementById('tickets-container').getAttribute('data-prev-page')
    const nextPage = document.getElementById('tickets-container').getAttribute('data-next-page')
    const prevEnabled = document.getElementById('tickets-container').getAttribute('data-prev-enabled')
    const nextEnabled = document.getElementById('tickets-container').getAttribute('data-next-enabled')
    const TicketsContainerWithProvider = (
      <Provider store={store}>
        <TicketsContainer
          view={view}
          page={page}
          prevPage={prevPage}
          nextPage={nextPage}
          prevEnabled={prevEnabled.toLowerCase() === 'true'}
          nextEnabled={nextEnabled.toLowerCase() === 'true'}
        />
      </Provider>
    )

    ReactDOM.render(TicketsContainerWithProvider, document.getElementById('tickets-container'))
  }

  if (document.getElementById('accounts-container')) {
    const title = document.getElementById('accounts-container').getAttribute('data-title')
    const view = document.getElementById('accounts-container').getAttribute('data-view')
    const AccountsContainerWithProvider = (
      <Provider store={store}>
        <AccountsContainer title={title} view={view} />
      </Provider>
    )

    ReactDOM.render(AccountsContainerWithProvider, document.getElementById('accounts-container'))
  }

  if (document.getElementById('teams-container')) {
    const TeamsContainerWithProvider = (
      <Provider store={store}>
        <TeamsContainer />
      </Provider>
    )

    ReactDOM.render(TeamsContainerWithProvider, document.getElementById('teams-container'))
  }

  if (document.getElementById('departments-container')) {
    const TeamsContainerWithProvider = (
      <Provider store={store}>
        <DepartmentsContainer />
      </Provider>
    )

    ReactDOM.render(TeamsContainerWithProvider, document.getElementById('departments-container'))
  }

  if (document.getElementById('settings-container')) {
    const SettingsContainerWithProvider = (
      <Provider store={store}>
        <SettingsContainer />
      </Provider>
    )

    ReactDOM.render(SettingsContainerWithProvider, document.getElementById('settings-container'))
  }
}
