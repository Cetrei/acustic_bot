class PrefixCommandBuilder {
    constructor() {
        this.name = null;
        this.description = null;
        this.permissions = [];
    }

    setName(name) {
        this.name = name;
        return this;
    }

    setDescription(description) {
        this.description = description;
        return this;
    }

    setDefaultMemberPermissions(permissions) {
        this.permissions = permissions;
        return this;
    }

    toJSON() {
        return {
            name: this.name,
            description: this.description,
            permissions: this.permissions
        };
    }
}

module.exports = PrefixCommandBuilder;
