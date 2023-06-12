using bookshop as my from '../db/data-model';

service CatalogService {
    entity Customer as projection on my.Customer;
}