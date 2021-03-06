module.exports = app => {

  class AtomClassController extends app.Controller {

    async register() {
      const res = await this.ctx.service.atomClass.register({
        module: this.ctx.request.body.module,
        atomClassName: this.ctx.request.body.atomClassName,
        atomClassIdParent: this.ctx.request.body.atomClassIdParent,
      });
      this.ctx.success(res);
    }

    async validatorSearch() {
      const res = await this.ctx.service.atomClass.validatorSearch({
        atomClass: this.ctx.request.body.atomClass,
      });
      this.ctx.success(res);
    }

    async checkRightCreate() {
      const res = await this.ctx.service.atomClass.checkRightCreate({
        atomClass: this.ctx.request.body.atomClass,
        user: this.ctx.user.op,
      });
      this.ctx.success(res);
    }

    async atomClass() {
      const res = await this.ctx.service.atomClass.atomClass({
        atomClass: this.ctx.request.body.atomClass,
      });
      this.ctx.success(res);
    }

  }

  return AtomClassController;
};
