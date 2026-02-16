function Get-Components {
    Get-Content -Path "public/component-library.json"
    | ConvertFrom-Json
    | Select-Object -ExpandProperty components    
}

function Get-ComponentCategories {
    Get-Components 
    | Select-Object -ExpandProperty categories
    | Select-Object -Unique
    | Sort-Object
}

function Get-ComponentTypes {
    Get-Components 
    | Select-Object -ExpandProperty type
    | Select-Object -Unique
    | Sort-Object
}
function Get-ComponentNames {
    Get-Components 
    | Select-Object -ExpandProperty name
    | Select-Object -Unique
    | Sort-Object
}

function Get-ComponentInterfaces {
    Get-Components 
    | Select-Object -ExpandProperty interfaces
}

function Get-ComponentsWithInterfaceTypeCustom {
    # Interface type custom is a hack to allow for custom interface types to be defined in the component library.
    # This is not a real interface type, but a placeholder to allow for custom interface types to be defined in the component library.
    # All components with custom interfaces should eventually be converted to real interface types.
    Get-Components 
    | Select-Object -ExpandProperty interfaces
    | Where-Object type -eq "custom"
}

function Get-AllComponentInterfaces {
    Get-Components 
    | ForEach-Object {
        $component = $_

        $_.interfaces 
        | ForEach-Object {
            [pscustomobject]@{
                Component = $component.name
                Name = $_.name
                Type = $_.type
                Direction = $_.direction
                Position = $_.position
                Icon = $_.icon
                Access = $_.access
                ValidationRules = $_.validationRules
                Metadata = $_.metadata
            }   
        }
    }
}

function Invoke-ComponentValidation {
    # Run through a series of validation steps to ensure the component library is valid.
    # 1. Validate that all components have a name.
    # 2. Validate that all components have a type.
    # 3. Validate that all components have a category.
    # 4. Validate that all components have an icon.
    # 5. Validate that all components have a description.
    # 6. Validate that all components have interfaces.
    # 7. Validate that all interfaces have a name.
    # 8. Validate that all interfaces have a type.
    # 9. Validate that all interfaces have a direction.
    # 10. Validate that all interfaces have a position.
    # 11. Validate that all interfaces have an icon.

    function New-ComponentValidationError {
        param(
            [string]$Message,
            [string]$Component,
            [string]$Interface
        )
        [pscustomobject]@{
            Component = $Component
            Interface = $Interface
            Message = $Message
        }
    }

    function Validate-ComponentName($component) {
        if (-not $component.name) {
            New-ComponentValidationError -Message "Component $($component.name) has no name." -Component $component.name
        }
    }

    function Validate-ComponentType($component) {
        if (-not $component.type) {
            New-ComponentValidationError -Message "Component $($component.name) has no type." -Component $component.name
        }
    }

    function Validate-ComponentCategory($component) {
        if (-not $component.categories) {
            New-ComponentValidationError -Message "Component $($component.name) has no categories." -Component $component.name
        }
    }

    function Validate-ComponentIcon($component) {
        if (-not $component.icon) {
            New-ComponentValidationError -Message "Component $($component.name) has no icon." -Component $component.name
        }
    }

    function Validate-ComponentDescription($component) {
        if (-not $component.description) {
            New-ComponentValidationError -Message "Component $($component.name) has no description." -Component $component.name
        }
    }

    function Validate-ComponentInterfaces($component) {
        if (-not $component.interfaces) {
            New-ComponentValidationError -Message "Component $($component.name) has no interfaces." -Component $component.name
        }
    }

    function Validate-InterfaceName($interface) {
        if (-not $interface.name) {
            New-ComponentValidationError -Message "Interface $($interface.name) has no name." -Component $interface.Component -Interface $interface.name
        }
    }

    function Validate-InterfaceType($interface) {
        if (-not $interface.type) {
            New-ComponentValidationError -Message "Interface $($interface.name) has no type." -Component $interface.Component  -Interface $interface.name
        }
    }

    function Validate-InterfaceDirection($interface) {
        if (-not $interface.direction) {
            New-ComponentValidationError -Message "Interface $($interface.name) has no direction." -Component $interface.Component -Interface $interface.name
        }
    }

    function Validate-InterfacePosition($interface) {
        if (-not $interface.position) {
            New-ComponentValidationError -Message "Interface $($interface.name) has no position." -Component $interface.Component -Interface $interface.name
        }
    }

    function Validate-InterfaceIcon($interface) {
        if (-not $interface.icon) {
            New-ComponentValidationError -Message "Interface $($interface.name) has no icon." -Component $interface.Component -Interface $interface.name
        }
    }

    Get-Components
    | ForEach-Object {
        Validate-ComponentName $_
        Validate-ComponentType $_
        Validate-ComponentCategory $_
        Validate-ComponentIcon $_
        Validate-ComponentDescription $_
        Validate-ComponentInterfaces $_
    }

    Get-AllComponentInterfaces
    | ForEach-Object {
        Validate-InterfaceName $_
        Validate-InterfaceType $_
        Validate-InterfaceDirection $_
        Validate-InterfacePosition $_
        Validate-InterfaceIcon $_
    }
}

Invoke-ComponentValidation