import $ = require("jquery")

import { api } from "../api"
import { cloneByJSON } from "../common"
import { getMeta, getUser } from "../globals"

function pFetchMenu() {
    const q = api.get("entity/F_Menu?pageNo=1&pageSize=1")
    return q.then(function(r) {
        return r.page && r.page[0]
    })
}

function canAccessMenu(target: string, user: User) {
    if (user.acl.menu && user.acl.menu[target]) return true
    if (user.roles) {
        const roleNames = Object.keys(user.roles)
        for (const rn of roleNames) {
            const role = user.roles[rn]
            if (role.acl.menu && role.acl.menu[target]) return true
        }
    }
    return false
}

export function pInitMenu() {
    return pFetchMenu().then(function(menuData: any) {
        const menuGroupsShown = []
        const user = getUser()
        const meta = getMeta()
        if (menuData) {
            // 按权限过滤
            const menuGroups = menuData && menuData.menuGroups || []
            for (const menuGroup of menuGroups) {
                const menuItems = menuGroup.menuItems
                const menuItemsShown: any[] = []
                for (const mi of menuItems) {
                    if (mi.toEntity) {
                        if ((user.admin || canAccessMenu(mi.toEntity, user))
                            && meta.entities[mi.toEntity])
                            menuItemsShown.push(mi)
                    } else if (mi.callFunc) {
                        if ((user.admin || canAccessMenu(mi.callFunc, user)))
                            menuItemsShown.push(mi)
                    }
                }
                if (menuItemsShown.length) {
                    const menuGroup2 = cloneByJSON(menuGroup)
                    menuGroup2.menuItems = menuItemsShown
                    menuGroupsShown.push(menuGroup2)
                    console.log(menuGroup2)
                }
            }
        }

        const $mainMenuBar = $(".main-menu-bar").empty()
        $mainMenuBar.html(ST.MenuItems({menuGroups: menuGroupsShown,
            user, meta}))

        // $items.on 'click', '.call-func', ->
        //     func = $(this).attr('func')
        //     F.ofPropertyPath(window, func)?()

        // $items.on 'click', '.menu-item', ->
        //     F.collapseMainMenu() if F.autoCollapseMainMenu

        // F.$mainMenu.on 'click', '.open-item', ->
        //     F.openPage $(this).attr('page-id')
        //     F.collapseMainMenu() if F.autoCollapseMainMenu
    })
}
