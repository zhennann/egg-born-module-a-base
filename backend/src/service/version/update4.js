module.exports = function(ctx) {

  class VersionUpdate4 {

    async run() {

      // aComment
      let sql = `
          CREATE TABLE aComment (
            id int(11) NOT NULL AUTO_INCREMENT,
            createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted int(11) DEFAULT '0',
            iid int(11) DEFAULT '0',
            atomId int(11) DEFAULT '0',
            userId int(11) DEFAULT '0',
            sorting int(11) DEFAULT '0',
            heartCount int(11) DEFAULT '0',
            replyId int(11) DEFAULT '0',
            replyUserId int(11) DEFAULT '0',
            replyContent text DEFAULT NULL,
            content text DEFAULT NULL,
            html text DEFAULT NULL,
            PRIMARY KEY (id)
          )
        `;
      await ctx.model.query(sql);

      sql = `
          create view aViewComment as
            select a.*,b.userName,b.avatar,c.userName as replyUserName from aComment a
              left join aUser b on a.userId=b.id
              left join aUser c on a.replyUserId=c.id
        `;
      await ctx.model.query(sql);

      // aCommentHeart
      sql = `
          CREATE TABLE aCommentHeart (
            id int(11) NOT NULL AUTO_INCREMENT,
            createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted int(11) DEFAULT '0',
            iid int(11) DEFAULT '0',
            userId int(11) DEFAULT '0',
            atomId int(11) DEFAULT '0',
            commentId int(11) DEFAULT '0',
            heart int(11) DEFAULT '1',
            PRIMARY KEY (id)
          )
        `;
      await ctx.model.query(sql);

      // aAtom
      sql = `
        ALTER TABLE aAtom
          MODIFY COLUMN updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ADD COLUMN allowComment int(11) DEFAULT '1',
          ADD COLUMN starCount int(11) DEFAULT '0',
          ADD COLUMN commentCount int(11) DEFAULT '0',
          ADD COLUMN attachmentCount int(11) DEFAULT '0',
          ADD COLUMN readCount int(11) DEFAULT '0'
                  `;
      await ctx.model.query(sql);

      // aSelectAtoms
      await ctx.model.query('drop procedure aSelectAtoms');
      sql = `
create procedure aSelectAtoms (in _tableName varchar(50),in __where text,in __orders text,in __limit text,in _iid int,in _userIdWho int,in _star int,in _label int)
begin
  -- tables
  -- a: aAtom
  -- b: aAtomClass
  -- c: aViewUserRightAtom
  -- d: aAtomStar
  -- e: aAtomLabelRef
  -- f: {item}
  -- g: aUser

  declare _where,_orders,_limit text;
  declare _starField,_starJoin,_starWhere text;
  declare _labelField,_labelJoin,_labelWhere text;
  declare _itemField,_itemJoin text;

  if __where<>'' then
    set _where=concat(__where,' AND');
  else
    set _where=' WHERE';
  end if;

  if __orders<>'' then
    set _orders=__orders;
  else
    set _orders='';
  end if;

  if __limit<>'' then
    set _limit=__limit;
  else
    set _limit='';
  end if;

  if _star<>0 then
    set _starJoin=' inner join aAtomStar d on a.id=d.atomId';
    set _starWhere=concat(' and d.iid=',_iid,' and d.userId=',_userIdWho,' and d.star=1');
  else
    set _starJoin='';
    set _starWhere='';
  end if;
    set _starField=concat(
        ',(select d2.star from aAtomStar d2 where d2.iid=',_iid,' and d2.atomId=a.id and d2.userId=',_userIdWho,') as star'
      );

  if _label<>0 then
    set _labelJoin=' inner join aAtomLabelRef e on a.id=e.atomId';
    set _labelWhere=concat(' and e.iid=',_iid,' and e.userId=',_userIdWho,' and e.labelId=',_label);
  else
    set _labelJoin='';
    set _labelWhere='';
  end if;
    set _labelField=concat(
        ',(select e2.labels from aAtomLabel e2 where e2.iid=',_iid,' and e2.atomId=a.id and e2.userId=',_userIdWho,') as labels'
      );

  if _tableName<>'' then
    set _itemField='f.*,';
    set _itemJoin=concat(' inner join ',_tableName,' f on f.atomId=a.id');
  else
    set _itemField='';
    set _itemJoin='';
  end if;

  set @sql=concat(
    'select ',_itemField,'a.id as atomId,a.itemId,a.atomEnabled,a.atomFlag,a.atomFlow,a.atomClassId,a.atomName,a.allowComment,a.starCount,a.commentCount,a.attachmentCount,a.readCount,a.userIdCreated,a.userIdUpdated,a.createdAt as atomCreatedAt,a.updatedAt as atomUpdatedAt,b.module,b.atomClassName,b.atomClassIdParent,g.userName,g.avatar',_starField,_labelField,' from aAtom a',
    ' inner join aAtomClass b on a.atomClassId=b.id',
    ' inner join aUser g on a.userIdCreated=g.id',
    _itemJoin,
    _starJoin,
    _labelJoin,
    _where,
    ' (',
    '  a.deleted=0 and a.iid=', _iid,
    _starWhere,
    _labelWhere,
    '    and (',
    '           (a.userIdCreated=',_userIdWho,') or',
    '             (a.atomEnabled=1 and (',
    '               (',
    '                 a.atomFlow=1 and (',
    '                   (exists(select c.atomId from aViewUserRightAtom c where c.iid=',_iid,' and a.id=c.atomId and c.action>2 and c.userIdWho=',_userIdWho,')) or',
    '                   (a.userIdCreated=',_userIdWho,' and exists(select c.atomClassId from aViewUserRightAtomClass c where c.iid=',_iid,' and a.atomClassId=c.atomClassId and c.action>2 and c.scope=0 and c.userIdWho=',_userIdWho,'))',
    '                 )',
    '               ) or (',
    '                 a.atomFlow=0 and (',
    '                   b.public=1 or exists(select c.atomId from aViewUserRightAtom c where c.iid=',_iid,' and a.id=c.atomId and c.action=2 and c.userIdWho=',_userIdWho,')',
    '                 )',
    '                )',
    '             ))',
    '        )',
    ' )',
    _orders,
    _limit
  );

  prepare stmt from @sql;
  execute stmt;
  deallocate prepare stmt;

end
`;
      await ctx.model.query(sql);

      // aGetAtom
      await ctx.model.query('drop procedure aGetAtom');
      sql = `
create procedure aGetAtom (in _tableName varchar(50),in _atomId int,in _iid int,in _userIdWho int)
begin
  -- tables
  -- a: aAtom
  -- b: aAtomClass
  -- d: aAtomStar
  -- e: aAtomLabelRef
  -- f: {item}
  -- g: aUser

  declare _starField,_labelField text;
  declare _itemField,_itemJoin text;

  if _userIdWho=0 then
    set _starField='';
  else
    set _starField=concat(
          ',(select d.star from aAtomStar d where d.iid=',_iid,' and d.atomId=a.id and d.userId=',_userIdWho,') as star'
        );
  end if;

  if _userIdWho=0 then
    set _labelField='';
  else
    set _labelField=concat(
          ',(select e.labels from aAtomLabel e where e.iid=',_iid,' and e.atomId=a.id and e.userId=',_userIdWho,') as labels'
        );
  end if;

  if _tableName<>'' then
    set _itemField='f.*,';
    set _itemJoin=concat(' inner join ',_tableName,' f on f.atomId=a.id');
  else
    set _itemField='';
    set _itemJoin='';
  end if;

  set @sql=concat(
    'select ',_itemField,'a.id as atomId,a.itemId,a.atomEnabled,a.atomFlag,a.atomFlow,a.atomClassId,a.atomName,a.allowComment,a.starCount,a.commentCount,a.attachmentCount,a.readCount,a.userIdCreated,a.userIdUpdated,a.createdAt as atomCreatedAt,a.updatedAt as atomUpdatedAt,b.module,b.atomClassName,b.atomClassIdParent,g.userName,g.avatar',_starField,_labelField,' from aAtom a',
    ' inner join aAtomClass b on a.atomClassId=b.id',
    ' inner join aUser g on a.userIdCreated=g.id',
    _itemJoin,
    ' where a.id=', _atomId,
    '   and a.deleted=0 and a.iid=', _iid
  );

  prepare stmt from @sql;
  execute stmt;
  deallocate prepare stmt;

end
`;
      await ctx.model.query(sql);

    }

  }

  return VersionUpdate4;
};
